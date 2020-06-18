/*!
 * Diva API
 * Copyright(c) 2019-2020 Konrad Baechler, https://diva.exchange
 * GPL3 Licensed
 */

'use strict'

import BigNumber from 'bignumber.js'
import { customAlphabet } from 'nanoid'
import path from 'path'

import { Db } from '../db'
import { Job, JOB_INTERFACE_API } from '../job'
import { Iroha } from './iroha'
import { Logger } from '@diva.exchange/diva-logger'
import { WebsocketServer } from '../websocket-server'
import { Environment } from '../environment'

const API_NAME = 'diva'
const API_VERSION = '0.1.0'
const API_LENGTH_PUBLICKEY_HEX = 64

const API_ALPHABET_USERNAME = 'abcdefghijklmnopqrstuvwxyz_0123456789'

const API_ERROR_INVALID_PUBLIC_KEY = 'invalid public key'
const API_ERROR_INVALID_IDENT_CONTRACT = 'invalid identContract'
const API_ERROR_NO_BLOCKCHAIN = 'no blockchain available'

const API_DOMAINID_HOLODECK = 'holodeck'
const REGEX_DOMAINID = /^([a-zA-Z]([a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?\.)*[a-zA-Z]([a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?$/

const API_WEBSOCKET_COMMAND_VERSION = 'version'
const API_WEBSOCKET_COMMAND_SUBSCRIBE = 'subscribe'
const API_WEBSOCKET_COMMAND_UNSUBSCRIBE = 'unsubscribe'

const API_WEBSOCKET_COMMAND_CHAT = 'chat'

const API_WEBSOCKET_RESOURCE_BLOCK = 'block'
const API_WEBSOCKET_RESOURCE_ORDERBOOK = 'orderbook'

const API_WEBSOCKET_SEND_OPTIONS = { compress: true, binary: false, mask: false, fin: true }

export class Api {
  /**
   * Factory
   *
   * @param httpServer {HttpServer}
   * @returns {Api}
   * @public
   */
  static make (httpServer) {
    return new Api(httpServer)
  }

  /**
   * @param httpServer {HttpServer}
   * @private
   */
  constructor (httpServer) {
    this.isReady = false
    this.mapContract = new Map()
    this.setMarketUpdate = new Set()
    this._latestBlock = {}
    this._httpServer = httpServer
    this._db = Db.connect()
    this.hasBlockchain = false
    Environment.hasBlockchain()
      .then((result) => {
        if (result) {
          this.hasBlockchain = true
          this._initIroha().then(() => {
            Logger.trace('API ready, Iroha ready, Markets loaded')
            this.isReady = true
          })
        } else {
          Logger.trace('API ready - without Iroha')
          this.isReady = true
        }
      })
  }

  /**
   * @returns {Promise<void>}
   * @private
   */
  async _initIroha () {
    this.iroha = await Iroha.make()

    // attach block watcher
    this.subscriberBlock = new Map()
    this.subscriberOrderbook = new Map()
    this.iroha.watch(
      (block) => { this._processBlock(block) },
      (error) => { this._errorBlock(error) }
    )

    await this._populate()
  }

  /**
   * Attach a Websocket Server
   * @returns {Api}
   */
  attachWebsocket () {
    // attach websocket events
    const websocket = WebsocketServer.make(this._httpServer)
    websocket.onMessage((id, ws, message) => this._onMessageWebsocket(id, ws, message))
    websocket.onClose((id, ws, code, reason) => this._onCloseWebsocket(id, ws, code, reason))
    return this
  }

  /**
   * @param id {number}
   * @param ws {WebSocket}
   * @param message {string}
   * @private
   */
  _onMessageWebsocket (id, ws, message) {
    let data
    try {
      data = JSON.parse(message)
    } catch (error) {
      ws.close(1002, 'invalid data: non-json')
      return
    }

    const _id = String(id)
    switch (data.command || '') {
      case API_WEBSOCKET_COMMAND_VERSION:
        ws.send(JSON.stringify({
          name: API_NAME,
          version: API_VERSION
        }), API_WEBSOCKET_SEND_OPTIONS, () => {})
        break
      case API_WEBSOCKET_COMMAND_CHAT:
        Logger.info('Incoming Chat Message: ' + (data.message || ''))
        break
      case API_WEBSOCKET_COMMAND_SUBSCRIBE:
        if (!this.hasBlockchain) {
          break
        }

        switch (data.resource || '') {
          case API_WEBSOCKET_RESOURCE_BLOCK:
            this.subscriberBlock.set(_id, ws)
            ws.send(JSON.stringify(this._latestBlock), API_WEBSOCKET_SEND_OPTIONS)
            break
          case API_WEBSOCKET_RESOURCE_ORDERBOOK:
            if (data.contract && this.mapContract.has(data.contract)) {
              const account = typeof data.account === 'string' ? data.account : ''
              const limit = typeof data.limit !== 'undefined' && data.limit > 0 ? parseInt(data.limit) : 0
              const group = typeof data.group !== 'undefined' && data.group
              const stack = this.subscriberOrderbook.get(_id) || []
              stack.push(new Map([[data.contract, { ws: ws, account: account, limit: limit, group: group }]]))
              this.subscriberOrderbook.set(_id, stack)

              const objData = this._getMarket(data.contract, account, group ? 0 : limit)
              if (group) {
                objData.bid = Api._group(objData.bid, limit, this.mapContract.get(data.contract).precision)
                objData.ask = Api._group(objData.ask, limit, this.mapContract.get(data.contract).precision)
              }
              ws.send(JSON.stringify(objData), API_WEBSOCKET_SEND_OPTIONS)
            }
            break
        }
        break
      case API_WEBSOCKET_COMMAND_UNSUBSCRIBE:
        if (!this.hasBlockchain) {
          break
        }

        switch (data.resource || '') {
          case API_WEBSOCKET_RESOURCE_BLOCK:
            this.subscriberBlock.delete(_id)
            break
          case API_WEBSOCKET_RESOURCE_ORDERBOOK:
            if (data.contract) {
              const stack = (this.subscriberOrderbook.get(_id) || []).filter(map => !map.has(data.contract))
              if (stack.length) {
                this.subscriberOrderbook.set(_id, stack)
                break
              }
            }
            this.subscriberOrderbook.delete(_id)
            break
        }
        break
    }
  }

  /**
   * @param id {number}
   * @param ws {WebSocket}
   * @param code {number}
   * @param reason {string}
   * @private
   */
  _onCloseWebsocket (id, ws, code, reason) {
    const _id = String(id)
    this.subscriberBlock.delete(_id)
    this.subscriberOrderbook.delete(_id)
  }

  /**
   * @param rq {Object}
   * @param rs {Object}
   * @param n {Function}
   * @public
   */
  execute (rq, rs, n) {
    if (!this.isReady) {
      return rs.sendStatus(503)
    }

    switch (rq.path) {
      case '/':
        rs.json({
          name: API_NAME,
          version: API_VERSION
        })
        break
      case '/alive-hosts':
      case '/hosts':
      case '/alive-hosts.txt':
      case '/hosts.txt':
        rs.sendFile(path.join(__dirname, '/../../static/i2p/hosts.txt'),
          {
            headers: {
              'Content-Type': 'text/plain'
            }
          }
        )
        break
      case '/user/create':
        this._getCreateUser(rq)
          .then((idJob) => { rs.json({ idJob: idJob }) })
          .catch((e) => { rs.status(500).json(e) })
        break
      case '/job':
        Api._getJobAsArray(rq)
          .then((arrayJob) => { rs.json(arrayJob) })
          .catch((e) => { rs.status(500).json(e) })
        break
      case '/order/set':
        this._postSetOrder(rq)
          .then((idJob) => { rs.json({ idJob: idJob }) })
          .catch((e) => { rs.status(500).json(e) })
        break
      case '/market':
        if (!rq.query.identContract || !this.mapContract.has(rq.query.identContract)) {
          rs.status(400).json(API_ERROR_INVALID_IDENT_CONTRACT)
          break
        }

        try {
          const identContract = rq.query.identContract
          const identAccount = rq.query.identAccount || ''
          const limit = (rq.query.limit || 0) > 0 ? Number(rq.query.limit) : 0
          let doGroup = false
          try {
            doGroup = !!JSON.parse(String(rq.query.doGroup || false).toLowerCase())
          } catch (error) {}
          const objMarket = this._getMarket(identContract, identAccount, doGroup ? 0 : limit)
          if (doGroup) {
            const precision = this.mapContract.get(identContract).precision
            objMarket.bid = Api._group(objMarket.bid, limit, precision)
            objMarket.ask = Api._group(objMarket.ask, limit, precision)
          }
          rs.json(objMarket)
        } catch (error) {
          rs.status(500).json(error.toString())
        }
        break
      default:
        n()
        break
    }
  }

  /**
   * @param array {Array}
   * @param limit {number}
   * @param precision {number}
   * @returns {Array}
   * @private
   */
  static _group (array, limit, precision) {
    if (!array.length) {
      return []
    }

    const arrayGroup = []
    let row
    let price = 0
    let amount = new BigNumber(0)
    let msTimestamp = 0
    while ((row = array.shift())) {
      if (price && price !== row[0]) {
        arrayGroup.push([price, amount.toFixed(precision), msTimestamp])
        if (limit > 0 && limit === arrayGroup.length) {
          return arrayGroup
        }
        amount = new BigNumber(0)
        msTimestamp = 0
      }
      [price, amount, msTimestamp] = [row[0], amount.plus(row[1]), msTimestamp || row[2]]
    }
    arrayGroup.push([price, amount.toFixed(precision), msTimestamp])

    return arrayGroup
  }

  /**
   * @param block {Object}
   * @private
   */
  _processBlock (block) {
    this._latestBlock = block
    block.blockV1.payload.transactionsList.forEach((t) => {
      t.payload.reducedPayload.commandsList
        .filter(o => o.setAccountDetail)
        .map(o => o.setAccountDetail).forEach(async (c) => {
          const arrayMatch = c.key.match(/^ob([A-Z0-9_]{1,32})t([BA])$/)
          if (arrayMatch) {
            this.setMarketUpdate.add([c.accountId, arrayMatch[1], arrayMatch[2]].join(','))
          }
        })
    })

    if (this.isReady) {
      this._updateMarket().then((setIdent) => {
        setIdent.forEach(v => {
          const [identContract, identAccount] = v.split(',')
          this.subscriberOrderbook.forEach((stack) => {
            stack.filter((map) => map.has(identContract)).forEach((map) => {
              const o = map.get(identContract)
              if (!o.account || o.account === identAccount) {
                const objData = this._getMarket(identContract, o.account, o.group ? 0 : o.limit)
                if (o.group) {
                  objData.bid = Api._group(objData.bid, o.limit, this.mapContract.get(identContract).precision)
                  objData.ask = Api._group(objData.ask, o.limit, this.mapContract.get(identContract).precision)
                }
                o.ws.send(JSON.stringify(objData), API_WEBSOCKET_SEND_OPTIONS, () => {})
              }
            })
          })
        })
      })
    }

    const data = JSON.stringify(this._latestBlock)
    this.subscriberBlock.forEach(ws => {
      ws.send(data, API_WEBSOCKET_SEND_OPTIONS)
    })
  }

  /**
   * @param block {Object}
   * @private
   */
  _errorBlock (block) {
    const data = JSON.stringify(block)
    this.subscriberBlock.forEach(ws => {
      ws.send(data)
    })
  }

  /**
   * @private
   */
  async _populate () {
    this._db.allAsArray('SELECT * FROM contract').forEach((row) => {
      this.mapContract.set(row.contract_ident, { precision: row.precision })
    })

    const arrayMarket = await this.iroha.getIrohaDb().getOrderBook()
    arrayMarket.forEach((row) => {
      this.setMarketUpdate.add([row.identAccount, row.identContract, row.type].join(','))
    })

    await this._updateMarket()
  }

  /**
   * @returns {Promise<Set>}
   * @private
   */
  async _updateMarket () {
    if (this.setMarketUpdate.size === 0) {
      return Promise.resolve(new Set())
    }

    const setIdent = new Set()
    await Promise.all(
      Array.from(this.setMarketUpdate).map(async (v) => {
        const [identAccount, identContract, type] = v.split(',')
        const arrayMarket = await this.iroha.getIrohaDb().getOrderBook(identContract, type, identAccount)
        this._db.begin()
        this._db.delete('DELETE FROM market WHERE account_ident = @a AND contract_ident = @c AND type = @t', {
          a: identAccount,
          c: identContract,
          t: type
        })
        arrayMarket.forEach((row) => {
          row.mapCurrent.forEach((arrayEntry, timestamp) => {
            this._db.insert(`INSERT INTO market (account_ident, contract_ident, timestamp_ms, type, price, amount)
                             VALUES (@a, @c, @ts, @t, @p, @am)`, {
              a: identAccount,
              c: identContract,
              t: type,
              ts: timestamp,
              p: arrayEntry[0],
              am: arrayEntry[1]
            })
          })
        })
        this._db.commit()
        setIdent.add([identContract, identAccount].join(','))
      })
    )

    this.setMarketUpdate.clear()
    return setIdent
  }

  /**
   * @param identContract {string}
   * @param identAccount {string}
   * @param limit {number}
   * @returns {Object}
   * @private
   */
  _getMarket (identContract, identAccount = '', limit = 0) {
    const sqlBid = `SELECT price, amount AS amount, timestamp_ms
      FROM market
      WHERE ${identAccount ? 'account_ident = @a' : '1'} AND contract_ident = @c AND type = 'B'
      ORDER BY price + 0 DESC, timestamp_ms
      ${limit ? ' LIMIT ' + limit : ''}`
    const sqlAsk = `SELECT price AS price, amount AS amount, timestamp_ms
      FROM market
      WHERE ${identAccount ? 'account_ident = @a' : '1'} AND contract_ident = @c AND type = 'A'
      ORDER BY price + 0, timestamp_ms
      ${limit ? ' LIMIT ' + limit : ''}`
    return {
      identAccount: identAccount,
      identContract: identContract,
      bid: this._db.allAsArray(sqlBid, { a: identAccount, c: identContract }, true),
      ask: this._db.allAsArray(sqlAsk, { a: identAccount, c: identContract }, true)
    }
  }

  /**
   * @param rq {Object} Request
   * @return {Promise<Array>}
   * @private
   */
  static async _getJobAsArray (rq) {
    return Job.getJobByIdAsArray(rq.query.idJob)
  }

  /**
   * @param rq {Object} Request
   * @returns {Promise<Job>}
   * @private
   */
  async _postSetOrder (rq) {
    if (!this.hasBlockchain) {
      throw new Error(API_ERROR_NO_BLOCKCHAIN)
    }

    return Job.add(
      JOB_INTERFACE_API,
      'iroha.setOrder("' + rq.body.account + '")',
      async () => this.iroha.setOrder(rq.body.account, rq.body.data, rq.body.signature)
    )
  }

  /**
   * @FIXME add Denial-of-Service protection
   *
   * @param rq {Object} Request
   * @returns {Promise<number>} Job id
   * @throws {Error}
   * @private
   */
  async _getCreateUser (rq) {
    if (!this.hasBlockchain) {
      throw new Error(API_ERROR_NO_BLOCKCHAIN)
    }

    const publickey = rq.query.publickey || false
    if (!publickey || publickey.length !== API_LENGTH_PUBLICKEY_HEX) {
      throw new Error(API_ERROR_INVALID_PUBLIC_KEY)
    }

    let domain = rq.query.domain || ''
    if (!(domain.match(REGEX_DOMAINID))) {
      domain = API_DOMAINID_HOLODECK
    }

    // create a new username, length: between 16 and 32 bytes
    const username = customAlphabet(API_ALPHABET_USERNAME, Math.floor(Math.random() * 16 + 16))()

    // create the user on the blockchain
    return Job.add(
      JOB_INTERFACE_API,
      'iroha.createAccount("' + username + '", "' + domain + '")',
      async () => this.iroha.createAccount(username, domain, publickey)
    )
  }
}

module.exports = { Api }

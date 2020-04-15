/*!
 * Diva Order
 * Copyright(c) 2019-2020 Konrad Baechler, https://diva.exchange
 * GPL3 Licensed
 */
'use strict'

import BigNumber from 'bignumber.js'
import request from 'request-promise-native'
import sodium from 'sodium-native'

import { Config } from '../../config'
import { Db } from '../../db'
import { JOB_STATUS_OK } from '../../job'
import { KeyStore } from '../../key-store'
import { Logger } from 'diva-logger'
import { shuffleArray } from '../../utils'

export class Order {
  /**
   * Factory
   *
   * @param identAccount {string}
   * @param identContract {string}
   * @returns {Order}
   * @throws {Error}
   * @public
   */
  static make (identAccount, identContract) {
    if (typeof identContract !== 'string' || !identContract.match(/^[A-Z0-9_]{1,32}$/)) {
      throw new Error('invalid contract')
    }

    return new Order(identAccount, identContract)
  }

  /**
   * @param identAccount {string}
   * @param identContract {string}
   * @throws {Error}
   * @private
   */
  constructor (identAccount, identContract) {
    this.identAccount = identAccount
    this.identContract = identContract

    this._db = Db.connect()
    this._config = Config.make()

    const r = this._db.firstAsObject('SELECT * FROM contract WHERE contract_ident = @contract_ident', {
      contract_ident: this.identContract
    })
    if (!r) {
      throw new Error('contract not found')
    }
    this.precision = r.precision

    this.delta = { B: new Map(), A: new Map() }
  }

  /**
   * @param price {string}
   * @param amount {string}
   * @returns {Order}
   * @public
   */
  addBid (price, amount) {
    return this._add('B', price, amount)
  }

  /**
   * @param msTimestamp {number} Timestamp identifier to be deleted, set to 0 to delete all
   * @returns {Order}
   * @public
   */
  deleteBid (msTimestamp = 0) {
    return this._delete('B', msTimestamp)
  }

  /**
   * @param price {string}
   * @param amount {string}
   * @returns {Order}
   * @public
   */
  addAsk (price, amount) {
    return this._add('A', price, amount)
  }

  /**
   * @param msTimestamp {number} Timestamp identifier to be deleted, set to 0 to delete all
   * @returns {Order}
   * @public
   */
  deleteAsk (msTimestamp = 0) {
    return this._delete('A', msTimestamp)
  }

  /**
   * @param type {string} 'B' or 'A', Bid or Ask
   * @param price {string}
   * @param amount {string}
   * @returns {Order}
   * @private
   */
  _add (type, price, amount) {
    this.delta[type].set(String(Date.now() + this.delta[type].size),
      [(new BigNumber(price)).toFixed(this.precision), (new BigNumber(amount)).toFixed(this.precision)])
    return this
  }

  /**
   * @param type {string}
   * @param msTimestamp {number}
   * @returns {Order}
   * @private
   */
  _delete (type, msTimestamp) {
    const book = this._getState(type)
    if (msTimestamp === 0) {
      for (msTimestamp of book.keys()) {
        this.delta[type].set(String(msTimestamp), [])
      }
    } else if (book.has(String(msTimestamp))) {
      this.delta[type].set(String(msTimestamp), [])
    }
    return this
  }

  /**
   * @returns {Promise<void[]>}
   * @public
   */
  async commit () {
    // clone data
    const delta = { B: new Map(this.delta.B), A: new Map(this.delta.A) }
    this.delta = { B: new Map(), A: new Map() }

    return Promise.all([
      this._setOrder('B', delta),
      this._setOrder('A', delta)
    ])
  }

  /**
   * @param type {string}
   * @param delta {Object}
   * @returns {Promise<void>}
   * @throws {Error}
   * @private
   */
  async _setOrder (type, delta) {
    if (!delta[type].size) {
      return Promise.resolve()
    }

    // build order data
    const state = this._getState(type)
    const mapCurrent = new Map(state)
    delta[type].forEach((v, k) => {
      if (v.length > 0) {
        mapCurrent.set(k, v)
      } else {
        mapCurrent.delete(k)
      }
    })

    const objData = {
      contract: this.identContract,
      type: type,
      arrayCurrent: Array.from(mapCurrent),
      arrayDelta: Array.from(delta[type]),
      signatureState: this._sign(Buffer.from(JSON.stringify(Array.from(state))))
    }

    const peer = shuffleArray(this._config.getValueByKey('diva.api.uri'))[0]
    const proxy = peer.match(/^.+\.i2p(:[\d]+)?$/) ? 'http://' + this._config.getValueByKey('i2p.http.proxy') : ''
    let response = await request({
      proxy: proxy,
      url: 'http://' + peer + '/order/set',
      method: 'POST',
      body: {
        account: this.identAccount,
        data: JSON.stringify(objData),
        signature: this._sign(Buffer.from(JSON.stringify(objData)))
      },
      json: true
    })
    if (!response.idJob) {
      Logger.error('Order._setOrder(): failed to get Job Id')
      throw new Error(JSON.stringify(response))
    }

    response = await request({
      proxy: proxy,
      url: 'http://' + peer + '/job?idJob=' + response.idJob,
      json: true
    })
    if (!response.job_status_ident || response.job_status_ident !== JOB_STATUS_OK) {
      Logger.error('Order._setOrder(): placement of Order failed')
      throw new Error(JSON.stringify(response))
    }
  }

  /**
   * @param type {string}
   * @returns {Map<string, Array>}
   * @private
   */
  _getState (type) {
    const book = new Map()

    this._db.allAsArray(`SELECT timestamp_ms, price, amount
      FROM orderbook
      WHERE account_ident = @a AND contract_ident = @c AND type = @t`, {
      a: this.identAccount,
      c: this.identContract,
      t: type
    }).forEach(r => {
      book.set(String(r.timestamp_ms), [r.price, r.amount])
    })

    return book
  }

  /**
   * @param data {Buffer}
   * @returns {string} Base64 encoded signature
   * @private
   */
  _sign (data) {
    /** @type Buffer */
    const bufferSignature = sodium.sodium_malloc(sodium.crypto_sign_BYTES)
    sodium.crypto_sign_detached(bufferSignature, data, KeyStore.make().get(this.identAccount + ':keyPrivate'))
    return bufferSignature.toString('base64')
  }
}

module.exports = { Order }

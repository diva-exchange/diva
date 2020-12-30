/*!
 * Diva Updater - Update trading-related data
 * Copyright(c) 2020 Konrad Baechler, https://diva.exchange
 * GPL3 Licensed
 */
'use strict'

import { Db } from '../db'
import { Logger } from '@diva.exchange/diva-logger'
import { hash } from '../utils/utils'
import { Network } from '../network'

const WEBSOCKET_SEND_OPTIONS = { compress: true, binary: false, mask: true, fin: true }

const REFRESH_INTERVAL = 5000

export class Updater {
  /**
   * Factory
   *
   * @returns {Updater}
   */
  static make () {
    return new Updater()
  }

  /**
   * @private
   */
  constructor () {
    this._db = Db.connect()
    this._arrayUser = []
    this._hashUser = 0
    this._arrayContract = []
    this._hashContract = 0
    this._errorWebSocket = ''
    this._retryWebSocket = 0

    this._updateUserContract()
  }

  /**
   * @private
   */
  _updateUserContract () {
    const arrayUser = this._db.allAsArray('SELECT account_ident FROM user')
    const hashUser = hash(JSON.stringify(arrayUser))
    const arrayContract = this._db.allAsArray('SELECT contract_ident FROM contract')
    const hashContract = hash(JSON.stringify(arrayContract))
    const isModified = this._hashUser !== hashUser || this._hashContract !== hashContract
    if (this._hashUser !== hashUser) {
      this._hashUser = hashUser
      this._arrayUser = arrayUser
    }
    if (this._hashContract !== hashContract) {
      this._hashContract = hashContract
      this._arrayContract = arrayContract
    }
    if (!isModified) {
      setTimeout(() => {
        this._updateUserContract()
      }, REFRESH_INTERVAL)
      return
    }

    Logger.trace('Updater._updateUserContract(): refreshing data...')
    if (this._ws) {
      this._ws.close(1001, 'Refresh')
    } else {
      this._connect()
    }
  }

  /**
   * @private
   */
  _connect () {
    this._ws = Network.make().getWebsocket()

    this._ws.on('error', (error) => {
      this._errorWebSocket = error
    })

    this._ws.on('open', () => { this._open() })
    this._ws.on('message', (data) => { this._onMessage(data) })
    this._ws.on('close', () => { this._onClose() })
  }

  /**
   * @private
   */
  _open () {
    Logger.trace('Updater._open(): connected')

    // subscribe
    this._arrayUser.forEach((rowUser) => {
      this._arrayContract.forEach((rowContract) => {
        this._ws.send(JSON.stringify({
          command: 'subscribe',
          resource: 'orderbook',
          contract: rowContract.contract_ident,
          account: rowUser.account_ident
        }), WEBSOCKET_SEND_OPTIONS)
      })
    })

    setTimeout(() => { this._updateUserContract() }, REFRESH_INTERVAL)
  }

  /**
   * @param data {string}
   * @private
   */
  _onMessage (data) {
    let objData
    try {
      objData = JSON.parse(data)
    } catch (error) {
      Logger.error(error).trace(data)
      return
    }

    this._db.begin()
    try {
      this._db.delete('DELETE FROM orderbook WHERE account_ident = @a AND contract_ident = @c', {
        a: objData.identAccount,
        c: objData.identContract
      })
      objData.bid.forEach(arrayRow => {
        this._db.insert(
          `INSERT INTO orderbook (account_ident, contract_ident, timestamp_ms, type, price, amount)
           VALUES (@a, @c, @ts, @t, @pr, @am)`, {
            a: objData.identAccount,
            c: objData.identContract,
            ts: arrayRow[2],
            t: 'B',
            pr: arrayRow[0],
            am: arrayRow[1]
          })
      })
      objData.ask.forEach(arrayRow => {
        this._db.insert(
          `INSERT INTO orderbook (account_ident, contract_ident, timestamp_ms, type, price, amount)
           VALUES (@a, @c, @ts, @t, @pr, @am)`, {
            a: objData.identAccount,
            c: objData.identContract,
            ts: arrayRow[2],
            t: 'A',
            pr: arrayRow[0],
            am: arrayRow[1]
          })
      })
      this._db.commit()
    } catch (error) {
      Logger.error(error)
      this._db.rollback()
    }
  }

  /**
   * @private
   */
  _onClose () {
    if (this._errorWebSocket) {
      Logger.error(this._errorWebSocket)
      this._errorWebSocket = ''
      this._retryWebSocket === 10 || this._retryWebSocket++
      setTimeout(() => { this._connect() }, Math.pow(this._retryWebSocket, 2) * 1000)
    } else {
      this._retryWebSocket = 0
      this._connect()
    }
  }
}

module.exports = { Updater }

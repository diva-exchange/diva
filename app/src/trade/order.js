/**
 * Copyright (C) 2020 diva.exchange
 *
 * This program is free software: you can redistribute it and/or modify
 * it under the terms of the GNU Affero General Public License as published by
 * the Free Software Foundation, either version 3 of the License, or
 * (at your option) any later version.
 *
 * This program is distributed in the hope that it will be useful,
 * but WITHOUT ANY WARRANTY; without even the implied warranty of
 * MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the
 * GNU Affero General Public License for more details.
 *
 * You should have received a copy of the GNU Affero General Public License
 * along with this program.  If not, see <https://www.gnu.org/licenses/>.
 *
 * Author/Maintainer: Konrad Bächler <konrad@diva.exchange>
 */

'use strict'

import BigNumber from 'bignumber.js'

import { Db } from '../db'
import { Logger } from '@diva.exchange/diva-logger'
import zlib from 'zlib'

const ORDER_VERSION_2 = 2 // base64 encoded object data
const ORDER_VERSION_3 = 3 // base64 encoded zlib-deflated object data
const ORDER_VERSION_CURRENT = ORDER_VERSION_3

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
   * @returns {({}|{contract, arrayDelta, type, arrayCurrent})[]}
   */
  commit () {
    // clone data
    const delta = { B: new Map(this.delta.B), A: new Map(this.delta.A) }
    this.delta = { B: new Map(), A: new Map() }

    return Order.packOrder([
      this._setOrder('B', delta),
      this._setOrder('A', delta)
    ])
  }

  /**
   * @param type {string}
   * @param delta {Object}
   * @throws {Error}
   * @private
   */
  _setOrder (type, delta) {
    if (!delta[type].size) {
      return {}
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

    return {
      contract: this.identContract,
      type: type,
      book: Array.from(mapCurrent)
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
   * @param data {string}
   * @param version {number}
   * @returns {Promise<Object>}
   * @throws {Error}
   * @public
   */
  static async unpackOrder (data, version = ORDER_VERSION_CURRENT) {
    // versioned data
    switch (version) {
      case ORDER_VERSION_2:
        return JSON.parse(Buffer.from(data, 'base64').toString())
      case ORDER_VERSION_3:
        return JSON.parse((zlib.inflateRawSync(Buffer.from(data, 'base64'))).toString())
      default:
        Logger.error('IrohaDb.unpackOrder()').error('unsupported order data version')
    }
  }

  /**
   * @param data {Object|Array}
   * @param version {number}
   * @returns {Promise<string>}
   * @throws {Error}
   * @public
   */
  static packOrder (data, version = ORDER_VERSION_CURRENT) {
    // versioned data
    switch (version) {
      case ORDER_VERSION_2:
        return version + ';' + Buffer.from(JSON.stringify(data)).toString('base64')
      case ORDER_VERSION_3:
        return version + ';' + (zlib.deflateRawSync(Buffer.from(JSON.stringify(data)))).toString('base64')
      default:
        Logger.error('IrohaDb.packOrder()').error('unsupported order data version')
    }
  }
}

module.exports = { Order }

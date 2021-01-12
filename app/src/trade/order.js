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

import { Db } from '../db'

export const ORDER_TYPE_BID = 'B'
export const ORDER_TYPE_ASK = 'A'

export const ORDER_STATUS_PENDING_ADDITION = 'PA'
export const ORDER_STATUS_PENDING_DELETION = 'PD'
export const ORDER_STATUS_CONFIRMED = 'C'

export class Order {
  /**
   * @typedef {Object} Order.Entry
   * @property {number} timestamp_ms
   * @property {string} price
   * @property {string} amount
   */

  /**
   * @typedef {Object} Order.Book
   * @property {number} id
   * @property {string} account
   * @property {string} contract
   * @property {string} type B (Bid) or A (Ask)
   * @property {Array<Order.Entry>} book
   */

  /**
   * Factory
   *
   * @param {string} identAccount
   * @param {string} identContract
   * @param {string} type - B (Bid) or A (Ask)
   * @return {Order}
   * @throws {Error}
   * @public
   */
  static make (identAccount, identContract, type) {
    if (typeof identContract !== 'string' || !identContract.match(/^[A-Z0-9_]{1,32}$/) || !type.match(/^[BA]$/)) {
      throw new Error('invalid order')
    }

    return new Order(identAccount, identContract, type)
  }

  /**
   * @param {string} identAccount
   * @param {string} identContract
   * @param {string} type - B (Bid) or A (Ask)
   * @throws {Error}
   * @private
   */
  constructor (identAccount, identContract, type) {
    this.account = identAccount
    this.contract = identContract
    this.type = type

    this._db = Db.connect()

    this._arrayOrderAdd = []
    this._arrayOrderDelete = []
  }

  /**
   * @return {Array<Order.Entry>}
   */
  getBook () {
    const sort = this.type === ORDER_TYPE_BID ? 'price DESC' : 'price'
    return this._db.allAsArray(`SELECT timestamp_ms, price, amount
      FROM orderbook
      WHERE account_ident = @a
        AND contract_ident = @c
        AND type = @t
        ORDER BY ${sort}`, {
      a: this.account,
      c: this.contract,
      t: this.type
    })
  }

  /**
   * @param {Array} arrayBook
   */
  setBook (arrayBook) {
    this._db.delete(`DELETE
      FROM orderbook
      WHERE account_ident = @a
        AND contract_ident = @c
        AND type = @t`, {
      a: this.account,
      c: this.contract,
      t: this.type
    })
    const sqlInsert = `INSERT INTO
      orderbook (account_ident, contract_ident, type, status, timestamp_ms, price, amount)
      VALUES (@a, @c, @t, @s, @ts, @pr, @am)`
    const params = []
    arrayBook.forEach((row) => {
      params.push({
        a: this.account,
        c: this.contract,
        t: this.type,
        s: ORDER_STATUS_CONFIRMED,
        ts: row.timestamp_ms,
        pr: row.price,
        am: row.amount
      })
    })
    this._db.insert(sqlInsert, params)
  }

  /**
   * @param {number} msTimestamp
   * @param {string} price
   * @param {string} amount
   * @return {Order.Book}
   * @private
   */
  add (msTimestamp, price, amount) {
    this._db.insert(
      `INSERT INTO orderbook (account_ident, contract_ident, timestamp_ms, status, type, price, amount)
       VALUES (@a, @c, @ts, @s, @t, @pr, @am)`, {
        a: this.account,
        c: this.contract,
        ts: msTimestamp,
        s: ORDER_STATUS_PENDING_ADDITION,
        t: this.type,
        pr: price,
        am: amount
      })

    this._arrayOrderAdd.push(msTimestamp)
    return {
      id: msTimestamp,
      account: this.account,
      contract: this.contract,
      type: this.type,
      book: this._getLocalBook()
    }
  }

  /**
   * @param {number} msTimestamp
   * @return {Order.Book}
   * @private
   */
  delete (msTimestamp) {
    this._db.update(`UPDATE orderbook
     SET status = @s
      WHERE account_ident = @a
        AND contract_ident = @c
        AND type = @t
        AND timestamp_ms = @ts`, {
      s: ORDER_STATUS_PENDING_DELETION,
      a: this.account,
      c: this.contract,
      t: this.type,
      ts: msTimestamp
    })

    this._arrayOrderDelete.push(msTimestamp)
    return {
      id: msTimestamp,
      account: this.account,
      contract: this.contract,
      type: this.type,
      book: this._getLocalBook()
    }
  }

  /**
   * @param {number} msTimestamp
   * @return {boolean}
   */
  confirm (msTimestamp) {
    if (this._arrayOrderAdd.indexOf(msTimestamp) > -1) {
      return this._db.update(`UPDATE orderbook
                       SET status = @s
                       WHERE status = @sw
                         AND account_ident = @a
                         AND contract_ident = @c
                         AND type = @t
                         AND timestamp_ms = @ts`, {
        s: ORDER_STATUS_CONFIRMED,
        sw: ORDER_STATUS_PENDING_ADDITION,
        a: this.account,
        c: this.contract,
        t: this.type,
        ts: msTimestamp
      }).changes > 0
    }

    if (this._arrayOrderDelete.indexOf(msTimestamp) > -1) {
      return this._db.delete(`DELETE
                              FROM orderbook
                              WHERE status = @sw
                                AND account_ident = @a
                                AND contract_ident = @c
                                AND type = @t
                                AND timestamp_ms = @ts`, {
        sw: ORDER_STATUS_PENDING_DELETION,
        a: this.account,
        c: this.contract,
        t: this.type,
        ts: msTimestamp
      }).changes > 0
    }

    return false
  }

  /**
   * @return {Array<Order.Entry>}
   * @private
   */
  _getLocalBook () {
    return this._db.allAsArray(`SELECT timestamp_ms, price, amount
      FROM orderbook
      WHERE status <> @sw
        AND account_ident = @a
        AND contract_ident = @c
        AND type = @t`, {
      sw: ORDER_STATUS_PENDING_DELETION,
      a: this.account,
      c: this.contract,
      t: this.type
    })
  }
}

module.exports = {
  Order,
  ORDER_TYPE_BID,
  ORDER_TYPE_ASK,
  ORDER_STATUS_PENDING_ADDITION,
  ORDER_STATUS_PENDING_DELETION,
  ORDER_STATUS_CONFIRMED
}

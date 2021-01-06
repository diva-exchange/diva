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

import { Db } from '../../db'
import { UXMain } from '../uxMain'
import { Culture } from '../culture'
import { Order } from '../../trade/order'

export class UXTrade extends UXMain {
  /**
   * @typedef {Object} UXTrade.ApiResponseGetOrderBook
   * @property {string} id
   * @property {string} channel
   * @property {string} command
   * @property {Array<UXTrade.ApiResponseBook>} books
   */

  /**
   * @typedef {Object} UXTrade.ApiResponseBook
   * @property {string} account
   * @property {string} contract
   * @property {string} type - B (Bid) or A (Ask)
   * @property {string} packedBook
   */

  /**
   * @typedef {Object} UXTrade.OrderBook
   * @property {string} account
   * @property {string} contract
   * @property {UXTrade.OrderBookEntry} books
   */

  /**
   * @typedef {Object} UXTrade.OrderBookEntry
   * @property {Array<UXTrade.Entry>} A - Ask
   * @property {Array<UXTrade.Entry>} B - Bid
   */

  /**
   * @typedef {Object} UXTrade.Entry
   * @property {number} timestamp_ms
   * @property {string} price
   * @property {string} amount
   */

  /**
   * Factory
   *
   * @param {HttpServer} server
   * @return {UXTrade}
   * @public
   */
  static make (server) {
    return new UXTrade(server)
  }

  /**
   * @param {HttpServer} server
   * @private
   */
  constructor (server) {
    super(server)
    this._db = Db.connect()
    this.identAccount = ''
    this.identContract = ''
    this._mapOrder = new Map()

    this.server.setFilterWebsocketLocal('trade:getorderbook', (obj) => { return this._getOrderBook(obj) })
    this.server.setFilterWebsocketLocal('trade:order:add', (obj) => { return this._add(obj) })
    this.server.setFilterWebsocketLocal('trade:order:delete', (obj) => { return this._delete(obj) })

    this.server.setFilterWebsocketApi('trade:getorderbook', (obj) => { return this._setOrderBook(obj) })
    this.server.setFilterWebsocketApi('trade:setorder', (obj) => { return this._confirm(obj) })
  }

  /**
   * @param {Object} rq - Request
   * @param {Object} rs - Response
   * @param {Function} n
   * @public
   */
  execute (rq, rs, n) {
    super.execute(rq, rs, n)

    const session = rq.session
    const identContract = rq.body.identContract || session.stateView[session.account].tradeIdentContract || 'BTC_XMR'
    session.stateView[session.account].tradeIdentContract = identContract

    this.identContract = identContract
    this.identAccount = session.account

    switch (rq.path) {
      case '/trade':
        return rs.render('diva/trade/trade', {
          identContract: identContract,
          arrayContract: this._getArrayContract()
        })
      case '/trade/contract/set':
        return rs.end()
      default:
        return n()
    }
  }

  /**
   * @param {Object} obj
   * @return {Object}
   * @private
   */
  _getOrderBook (obj) {
    obj.contract = this.identContract
    obj.account = this.identAccount
    return obj
  }

  /**
   * @param {UXTrade.ApiResponseGetOrderBook} response
   * @return {UXTrade.OrderBook}
   * @private
   */
  _setOrderBook (response) {
    const orderBook = {}
    response.books.forEach((o) => {
      if (o.account === this.identAccount && o.contract === this.identContract) {
        const order = Order.make(o.account, o.contract, o.type)
        order.setBook(Order.unpackOrder(o.packedBook))
        orderBook.books[o.type] = order.getBook()
      }
    })
    orderBook.contract = this.identContract
    orderBook.account = this.identAccount
    return orderBook
  }

  /**
   * @param {Object} obj
   * @return {Object}
   * @throws {Error}
   * @private
   */
  _add (obj) {
    if (!obj.type || !obj.price || !obj.amount || obj.price <= 0 || obj.amount <= 0) {
      throw new Error('invalid trade:order:add object')
    }
    const order = Order.make(this.identAccount, this.identContract, obj.type)
    const orderBook = order.add(obj.price, obj.amount)
    this._mapOrder.set(orderBook.id, order)

    return {
      channel: 'trade',
      command: 'setorder',
      id: orderBook.id,
      key: 'ob' + orderBook.contract + 't' + orderBook.type,
      value: orderBook.packedBook
    }
  }

  /**
   * @param {Object} obj
   * @return {Object}
   * @throws {Error}
   * @private
   */
  _delete (obj) {
    if (!obj.type || !obj.msTimestamp) {
      throw new Error('invalid trade:delete object')
    }

    const order = Order.make(this.identAccount, this.identContract, obj.type)
    const orderBook = order.delete(obj.msTimestamp)
    this._mapOrder.set(orderBook.id, order)

    return {
      channel: 'trade',
      command: 'setorder',
      id: orderBook.id,
      key: 'ob' + orderBook.contract + 't' + orderBook.type,
      value: orderBook.packedBook
    }
  }

  /**
   * @param {Object} obj
   * @return {Object|false}
   * @private
   */
  _confirm (obj) {
    const order = this._mapOrder.get(obj.response)
    if (order && order.confirm(obj.response)) {
      this._mapOrder.delete(obj.response)
      return {
        channel: 'trade',
        command: 'confirm',
        id: obj.response,
        account: order.account,
        contract: order.contract,
        type: order.type
      }
    }
    return false
  }

  /**
   * @return {Array}
   * @private
   */
  _getArrayContract () {
    return Array.from(
      Culture.translateArray(this._db.allAsArray('SELECT contract_ident FROM contract').map(v => v.contract_ident))
    )
  }
}

module.exports = { UXTrade }

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

import Big from 'big.js'
import { Db } from '../../db'
import { Culture } from '../culture'
import { Logger } from '@diva.exchange/diva-logger'
import { Order, ORDER_TYPE_BID, ORDER_TYPE_ASK } from '../../trade/order'
import { UXMain } from '../uxMain'

const CHANNEL_ORDER = 'order'

export class UXTrade extends UXMain {
  /**
   * @typedef {Object} UXTrade.ApiResponseGetOrderBook
   * @property {string} id
   * @property {string} channel
   * @property {string} command
   * @property {?Array<UXTrade.ApiResponseBook>} book
   * @property {?string} error
   */

  /**
   * @typedef {Object} UXTrade.ApiResponseBook
   * @property {string} account
   * @property {string} contract
   * @property {Array<Order.Entry>} B - Bid
   * @property {Array<Order.Entry>} A - Ask
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
    this.precision = 0

    this._mapOrder = new Map()

    this.server.setFilterWebsocketLocal('order:getBook', (obj) => { return this._getOrderBook(obj) })
    this.server.setFilterWebsocketLocal('order:add', (request, ws) => { return this._add(request, ws) })
    this.server.setFilterWebsocketLocal('order:delete', (request, ws) => { return this._delete(request, ws) })

    this.server.setFilterWebsocketApi('order:getBook', (response) => { return this._setLocalOrderBook(response) })
    this.server.setFilterWebsocketApi('order:set', (response) => { return this._confirm(response) })
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

    const r = this._db.firstAsObject('SELECT * FROM contract WHERE contract_ident = @contract_ident', {
      contract_ident: this.identContract
    })
    if (!r) {
      throw new Error('contract not found')
    }
    this.precision = r.precision

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
   * @param {Object} request
   * @return {Object}
   * @private
   */
  _getOrderBook (request) {
    request.contract = this.identContract
    request.account = this.identAccount
    return request
  }

  /**
   * @param {UXTrade.ApiResponseGetOrderBook} response
   * @return {UXTrade.ApiResponseGetOrderBook|boolean}
   * @private
   */
  _setLocalOrderBook (response) {
    if (response.error) {
      Logger.warn('_setLocalOrderBook error').trace(response.error)
      return false
    }
    if (response.book.account === this.identAccount && response.book.contract === this.identContract) {
      Order.make(response.book.account, response.book.contract, ORDER_TYPE_BID).setBook(response.book[ORDER_TYPE_BID])
      Order.make(response.book.account, response.book.contract, ORDER_TYPE_ASK).setBook(response.book[ORDER_TYPE_ASK])
    }

    return response
  }

  /**
   * @param {Object} request
   * @param {WebSocket} ws
   * @return {Object}
   * @throws {Error}
   * @private
   */
  _add (request, ws) {
    request.id = Number(request.id || 0)
    request.price = (new Big(request.price || 0)).toFixed(this.precision)
    request.amount = (new Big(request.amount || 0)).toFixed(this.precision)
    if (!request.type || !request.price || !request.amount || request.price <= 0 || request.amount <= 0) {
      throw new Error('invalid order:add request')
    }
    // echo
    ws.send(JSON.stringify(request))

    const order = Order.make(this.identAccount, this.identContract, request.type)
    const orderBook = order.add(request.id, request.price, request.amount)
    this._mapOrder.set(orderBook.id, order)

    return {
      channel: CHANNEL_ORDER,
      command: 'set',
      id: orderBook.id,
      contract: orderBook.contract,
      type: orderBook.type,
      book: orderBook.book
    }
  }

  /**
   * @param {Object} request
   * @param {WebSocket} ws
   * @return {Object}
   * @throws {Error}
   * @private
   */
  _delete (request, ws) {
    request.id = Number(request.id || 0)
    if (!request.type || !request.id) {
      throw new Error('invalid order:delete request')
    }
    // echo
    ws.send(JSON.stringify(request))

    const order = Order.make(this.identAccount, this.identContract, request.type)
    const orderBook = order.delete(request.id)
    this._mapOrder.set(orderBook.id, order)

    return {
      channel: CHANNEL_ORDER,
      command: 'set',
      id: orderBook.id,
      contract: orderBook.contract,
      type: orderBook.type,
      book: orderBook.book
    }
  }

  /**
   * @param {Object} response
   * @return {Object|false}
   * @private
   */
  _confirm (response) {
    response.command = 'confirm'
    if (response.error) {
      return response
    }

    const id = Number(response.id)
    const order = this._mapOrder.get(id)
    if (order && order.confirm(id)) {
      this._mapOrder.delete(id)
      response.account = order.account
      response.contract = order.contract
      response.type = order.type
    } else {
      response.error = 'confirm failed'
    }
    return response
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

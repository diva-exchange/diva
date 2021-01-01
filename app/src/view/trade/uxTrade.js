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
import { Logger } from '@diva.exchange/diva-logger'

export class UXTrade extends UXMain {
  /**
   * Factory
   *
   * @param server {HttpServer}
   * @returns {UXTrade}
   * @public
   */
  static make (server) {
    return new UXTrade(server)
  }

  /**
   * @param server {HttpServer}
   * @private
   */
  constructor (server) {
    super(server)
    this._db = Db.connect()
    this.identAccount = ''
    this.identContract = ''

    this.server.setFilterWebsocketLocal('trade:add:buy', (json) => { return this._add(json) })
    this.server.setFilterWebsocketLocal('trade:add:sell', (json) => { return this._add(json) })
    this.server.setFilterWebsocketLocal('trade:delete:buy', (json) => { return this._delete(json) })
    this.server.setFilterWebsocketLocal('trade:delete:sell', (json) => { return this._delete(json) })
    this.server.setFilterWebsocketApi('trade', (json) => { return this._filterApi(json) })
  }

  /**
   * @param json {string}
   * @returns {string}
   * @throws {Error}
   * @private
   */
  _add (json) {
    const obj = JSON.parse(json)
    if (!obj.type || !obj.price || !obj.amount) {
      throw new Error('invalid trade:add object')
    }
    const order = obj.type === 'B'
      ? Order.make(this.identAccount, this.identContract).addBid(obj.price, obj.amount)
      : Order.make(this.identAccount, this.identContract).addAsk(obj.price, obj.amount)
    return JSON.stringify({
      channel: 'trade',
      command: 'setorder',
      contract: this.identContract,
      type: obj.type,
      accountId: this.identAccount,
      key: 'ob' + this.identContract + 't' + obj.type,
      value: order.commit()
    })
  }

  /**
   * @param json {string}
   * @returns {string}
   * @throws {Error}
   * @private
   */
  _delete (json) {
    const obj = JSON.parse(json)
    if (!obj.type || !obj.msTimestamp) {
      throw new Error('invalid trade:delete object')
    }
    const order = obj.type === 'B'
      ? Order.make(this.identAccount, this.identContract).deleteBid(obj.msTimestamp)
      : Order.make(this.identAccount, this.identContract).deleteAsk(obj.msTimestamp)
    return JSON.stringify({
      channel: 'trade',
      command: 'setorder',
      contract: this.identContract,
      type: obj.type,
      accountId: this.identAccount,
      key: 'ob' + this.identContract + 't' + obj.type,
      value: order.commit()
    })
  }

  /**
   * @param json {string}
   * @returns {string}
   * @private
   */
  _filterApi (json) {
    const obj = JSON.parse(json)
    Logger.trace(obj)
    return json
  }

  /**
   * @param rq {Object} Request
   * @param rs {Object} Response
   * @param n {Function}
   * @public
   */
  execute (rq, rs, n) {
    if (!UXMain.isAuth(rq)) {
      return UXMain.redirectAuth(rs)
    }

    const session = rq.session
    const identContract = rq.body.identContract || session.stateView[session.account].tradeIdentContract || 'BTC_XMR'
    session.stateView[session.account].tradeIdentContract = identContract

    this.identContract = identContract
    this.identAccount = session.account

    Logger.trace(session)

    let order
    switch (rq.path) {
      case '/trade/contract/set':
        return rs.end()
      case '/trade/order/buy':
      case '/trade/order/sell':
      case '/trade/delete/buy':
      case '/trade/delete/sell':
        order = Order.make(session.account, identContract)
        break
    }

    switch (rq.path) {
      case '/trade':
        return rs.render('diva/trade/trade', {
          identContract: identContract,
          arrayContract: this._getArrayContract()
        })
      case '/trade/order/buy':
        order.addBid(rq.body.price, rq.body.amount)
        break
      case '/trade/order/sell':
        order.addAsk(rq.body.price, rq.body.amount)
        break
      case '/trade/delete/buy':
        order.deleteBid(rq.body.msTimestamp)
        break
      case '/trade/delete/sell':
        order.deleteAsk(rq.body.msTimestamp)
        break
      default:
        return n()
    }

    order.commit()
      .then(() => {
        rs.end()
      })
      .catch((error) => {
        Logger.error('Order commit failed').trace(error)
        rs.status(500).end(error)
      })
  }

  /**
   * @returns {Array}
   * @private
   */
  _getArrayContract () {
    return Array.from(
      Culture.translateArray(this._db.allAsArray('SELECT contract_ident FROM contract').map(v => v.contract_ident))
    )
  }
}

module.exports = { UXTrade }

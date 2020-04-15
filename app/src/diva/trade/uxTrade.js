/*!
 * diva UXTrade
 * Copyright(c) 2019-2020 Konrad Baechler, https://diva.exchange
 * GPL3 Licensed
 */

'use strict'

import { Db } from '../../db'
import { UXMain } from '../uxMain'
import { Culture } from '../../culture'
import { Order } from './order'
import { Logger } from 'diva-logger'

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
  }

  /**
   * @param rq {Object} Request
   * @param rs {Object} Response
   * @param n {Function}
   * @public
   */
  execute (rq, rs, n) {
    if (!this.isAuth(rq)) {
      return this.redirectAuth(rs)
    }

    const session = rq.session
    const identContract = rq.body.identContract || session.stateView[session.account].tradeIdentContract || 'BTC_XMR'
    if (identContract !== session.stateView[session.account].tradeIdentContract) {
      session.stateView[session.account].tradeIdentContract = identContract
    }

    let order
    switch (rq.path) {
      case '/trade/contract/set':
        rs.end()
        return
      case '/trade/order/buy':
      case '/trade/order/sell':
      case '/trade/delete/buy':
      case '/trade/delete/sell':
        order = Order.make(session.account, identContract)
        break
    }

    switch (rq.path) {
      case '/trade':
        rs.render('diva/trade/trade', {
          identContract: identContract,
          arrayContract: this._getArrayContract()
        })
        return
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
        n()
        return
    }

    order.commit()
      .then(() => {
        rs.end()
      })
      .catch((error) => {
        Logger.error(error)
        rs.status(500).end(error.toString())
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

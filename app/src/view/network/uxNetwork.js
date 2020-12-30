/*!
 * diva uxNetwork
 * Copyright(c) 2019 Konrad Baechler, https://diva.exchange
 * GPL3 Licensed
 */

'use strict'

import { UXMain } from '../uxMain'

export class UXNetwork extends UXMain {
  /**
   * Factory
   *
   * @param server {HttpServer}
   * @returns {UXNetwork}
   * @public
   */
  static make (server) {
    return new UXNetwork(server)
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

    switch (rq.path) {
      case '/network':
        rs.render('diva/network/network', {})
        break
      default:
        n()
    }
  }
}

module.exports = { UXNetwork }

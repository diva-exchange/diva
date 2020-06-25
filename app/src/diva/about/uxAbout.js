/*!
 * diva uxAbout
 * Copyright(c) 2019 Konrad Baechler, https://diva.exchange
 * GPL3 Licensed
 */

'use strict'

import { UXMain } from '../uxMain'

export class UXAbout extends UXMain {
  /**
   * Factory
   *
   * @param server {HttpServer}
   * @returns {UXAbout}
   * @public
   */
  static make (server) {
    return new UXAbout(server)
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
      case '/about':
        rs.render('diva/about/about', {})
        break
      default:
        n()
    }
  }
}

module.exports = { UXAbout }

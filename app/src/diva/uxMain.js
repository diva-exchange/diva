/*!
 * diva UXMain
 * Copyright(c) 2019 Konrad Baechler, https://diva.exchange
 * GPL3 Licensed
 */

'use strict'

import { KeyStore } from '../key-store'
import { UXAuth } from './uxAuth'

export class UXMain {
  /**
   * Factory
   *
   * @param server {HttpServer}
   * @returns {UXMain}
   * @public
   */
  static make (server) {
    return new UXMain(server)
  }

  /**
   * @param httpServer {HttpServer}
   * @private
   */
  constructor (httpServer) {
    this.server = httpServer

    // attach websocket events here, if desired
  }

  /**
   * @param rq {Object} Request
   * @param rs {Object} Response
   * @param n {Function}
   * @public
   */
  execute (rq, rs, n) {
    if (!UXMain.isAuth(rq)) {
      UXAuth._login(rq, rs)
      // return UXMain.redirectAuth(rs)
    }

    rs.render('diva/main', {})
  }

  /**
   * @param rq {Object} Request
   * @returns {boolean}
   * @public
   */
  static isAuth (rq) {
    if (!rq.session || !rq.session.isAuthenticated) {
      return false
    }
    return !!KeyStore.make().get(rq.session.account + ':keyPrivate')
  }

  /**
   * @param rs {Object} Response
   * @public
   */
  static redirectAuth (rs) {
    // redirect to login
    rs.redirect('/auth')
    rs.end()
  }
}

module.exports = { UXMain }

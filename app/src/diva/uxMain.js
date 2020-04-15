/*!
 * diva UXMain
 * Copyright(c) 2019 Konrad Baechler, https://diva.exchange
 * GPL3 Licensed
 */

'use strict'

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
    if (!this.isAuth(rq)) {
      return this.redirectAuth(rs)
    }

    rs.render('diva/main', {})
  }

  /**
   * @param rq {Object} Request
   * @returns {boolean}
   * @public
   */
  isAuth (rq) {
    return rq.session !== 'undefined' && rq.session.isAuthenticated
  }

  /**
   * @param rs {Object} Response
   * @public
   */
  redirectAuth (rs) {
    // redirect to login
    rs.redirect('/auth')
    rs.end()
  }
}

module.exports = { UXMain }

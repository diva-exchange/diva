/*!
 * diva UXCulture
 * Copyright(c) 2019 Konrad Baechler, https://diva.exchange
 * GPL3 Licensed
 */

'use strict'

import { Culture } from '../culture'

export class UXCulture {
  /**
   * Factory
   *
   * @param server {HttpServer}
   * @returns {UXCulture}
   * @public
   */
  static make (server) {
    return new UXCulture(server)
  }

  /**
   * @param httpServer {HttpServer}
   * @private
   */
  constructor (httpServer) {
    this.server = httpServer
  }

  /**
   * @param rq {Object}
   * @param rs {Object}
   * @param n {Function}
   * @public
   */
  execute (rq, rs, n) {
    const session = rq.session
    const objData = {}
    switch (rq.path) {
      // post
      case '/translate':
        Culture.init(rq)
        if (session.isAuthenticated && session.account && session.stateView[session.account]) {
          session.stateView[session.account].uiLanguage = Culture.uiLanguage
        } else {
          session.uiLanguage = Culture.uiLanguage
        }
        for (const type in rq.body) {
          if (Object.prototype.hasOwnProperty.call(rq.body, type) && Array.isArray(rq.body[type])) {
            objData[type] = Array.from(Culture.translateArray(rq.body[type]))
          }
        }
        rs.json(objData)
        break
      default:
        n()
    }
  }
}

module.exports = { UXCulture }

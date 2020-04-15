/*!
 * diva uxConfig
 * Copyright(c) 2019 Konrad Baechler, https://diva.exchange
 * GPL3 Licensed
 */

'use strict'

import http from 'http'
import { UXMain } from '../uxMain'

export class UXConfig extends UXMain {
  /**
   * Factory
   *
   * @param server {HttpServer}
   * @returns {UXConfig}
   * @public
   */
  static make (server) {
    return new UXConfig(server)
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

    const url = 'http://' + rq.hostname
    const port = rq.query.port && rq.query.port > 0 && rq.query.port <= 0xffff
      ? rq.query.port : 7070

    switch (rq.path) {
      case '/config/has-i2p-webconsole':
        // test a port
        http.get(url + ':' + port, { timeout: 200 }, (rsp) => {
          rs.statusCode = 200
          rs.json({ port: port, headers: rsp.headers })
        }).on('error', (error) => {
          rs.statusCode = 500
          rs.json(error)
        })

        break
      case '/config':
        rs.render('diva/config/config', {})
        break
      default:
        n()
    }
  }
}

module.exports = { UXConfig }

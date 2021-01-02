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
    super.execute(rq, rs, n)

    const url = 'http://' + rq.hostname
    const port = rq.query.port && rq.query.port > 0 && rq.query.port <= 0xffff ? rq.query.port : 7070

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

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

import { Culture } from './culture'

export class UXCulture {
  /**
   * Factory
   *
   * @param {HttpServer} httpServer
   * @return {UXCulture}
   * @public
   */
  static make (httpServer) {
    return new UXCulture(httpServer)
  }

  /**
   * @param {HttpServer} httpServer
   * @private
   */
  constructor (httpServer) {
    this.server = httpServer
  }

  /**
   * @param {Object} rq - Request
   * @param {Object} rs - Response
   * @param {Function} n
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

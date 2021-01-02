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

import { KeyStore } from '../auth/key-store'
import { UXAuth } from './auth/uxAuth'
import { Config } from '../config/config'

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
    this.config = Config.make()
  }

  /**
   * @param rq {Object} Request
   * @param rs {Object} Response
   * @param n {Function}
   * @public
   */
  execute (rq, rs, n) {
    if (!UXMain.isAuth(rq)) {
      // @FIXME
      UXAuth._login(rq, rs)
      // return UXMain.redirectAuth(rs)
    }
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

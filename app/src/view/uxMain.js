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

import { Config } from '../config/config'
import { KeyStore } from '../auth/key-store'
import { Logger } from '@diva.exchange/diva-logger'
import { UXAuth } from './auth/uxAuth'

export class UXMain {
  /**
   * Factory
   *
   * @param server {HttpServer}
   * @return {UXMain}
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

    this.server.setFilterWebsocketApi('block:new', (response) => { return UXMain._onBlock(response) })
  }

  /**
   * @param {Object} rq - Request
   * @param {Object} rs - Response
   * @param {Function} n
   * @public
   */
  execute (rq, rs, n) {
    if (!rq.session || !rq.session.isAuthenticated) {
      // @FIXME does not support multiple users
      UXAuth.login(rq, rs)
    }
    KeyStore.make().get(rq.session.account + ':keyPrivate')
  }

  /**
   * @param {Object} response
   * @return {Object|false}
   * @private
   */
  static _onBlock (response) {
    try {
      return response
    } catch (error) {
      Logger.warn('_onBlock error').trace(error)
      return false
    }
  }
}

module.exports = { UXMain }

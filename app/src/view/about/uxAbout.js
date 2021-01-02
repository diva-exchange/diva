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
    super.execute(rq, rs, n)

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

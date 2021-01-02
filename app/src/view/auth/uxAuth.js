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

import { Culture } from '../culture'
import { Config } from '../../config/config'
import { Logger } from '@diva.exchange/diva-logger'
import { User } from '../../auth/user'
import { KeyStore } from '../../auth/key-store'

export class UXAuth {
  /**
   * Factory
   *
   * @param httpServer {HttpServer}
   * @returns {UXAuth}
   * @public
   */
  static make (httpServer) {
    return new UXAuth(httpServer)
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
    const account = Config.make().getValueByKey('iroha.account')
    session.isAuthenticated = false
    KeyStore.make().delete(session.account + ':keyPrivate')
    session.account = Buffer.from(session.account || '').fill('0').toString()
    session.keyPublic = Buffer.from(session.keyPublic || '').fill('0').toString()
    if (typeof session.stateView === 'undefined') {
      session.stateView = {}
    }

    switch (rq.path) {
      // get
      case '/logout':
        rs.redirect('/auth' + (account && account.replace(/0/g, '') ? '?account=' + account : ''))
        rs.end()
        break
      case '/auth':
        UXAuth._login(rq, rs)
        break
      default:
        n()
    }
  }

  /**
   * @param rq {Object} Request
   * @param rs {Object} Response
   * @private
   */
  static _auth (rq, rs) {
    const arrayUser = User.allAsArray()
    if (arrayUser.length > 0) {
      rs.render('diva/auth', {
        title: 'Login',
        arrayUser: arrayUser,
        account: rq.query.account || ''
      })
    } else {
      rs.redirect('/newuser')
      rs.end()
    }
  }

  /**
   * @param rq {Object} Request
   * @param rs {Object} Response
   * @private
   */
  static _login (rq, rs) {
    const session = rq.session
    try {
      const user = User.open(Config.make().getValueByKey('iroha.account'))
      // const user = User.open(rq.body.account || '', rq.body.password || '')
      session.isAuthenticated = true
      session.account = user.getAccountIdent()
      session.keyPublic = user.getPublicKey()
      if (typeof session.stateView !== 'undefined' && typeof session.stateView[session.account] === 'undefined') {
        session.stateView[session.account] = {
          pathView: '/',
          uiLanguage: Culture.languageFromRequest(rq)
        }
      }
    } catch (error) {
      Logger.error(error)
    }
  }
}

module.exports = { UXAuth }

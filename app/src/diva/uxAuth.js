/*!
 * diva UXAuth
 * Copyright(c) 2019-2020 Konrad Baechler, https://diva.exchange
 * GPL3 Licensed
 */

'use strict'

import { Logger } from '@diva.exchange/diva-logger'

import { Culture } from '../culture'
import { User } from './config/user'
import { KeyStore } from '../key-store'

export class UXAuth {
  /**
   * Factory
   *
   * @param server {HttpServer}
   * @returns {UXAuth}
   * @public
   */
  static make (server) {
    return new UXAuth(server)
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
    const account = session.account || ''
    session.isAuthenticated = false
    KeyStore.make().delete(session.account + ':keyPrivate')
    session.account = Buffer.from(session.account || '').fill('0').toString()
    session.keyPublic = Buffer.from(session.keyPublic || '').fill('0').toString()
    if (typeof session.stateView === 'undefined') {
      session.stateView = {}
    }

    switch (rq.path) {
      // post
      case '/register':
        User.register(rq.body.password || '')
          .then((user) => {
            rs.json({
              username: user.getUsername(),
              domain: user.getDomain()
            })
          })
          .catch((error) => {
            n(error)
          })
        break
      case '/login':
        UXAuth._login(rq, rs)
        break
      // get
      case '/logout':
        rs.redirect('/auth' + (account && account.replace(/0/g, '') ? '?account=' + account : ''))
        rs.end()
        break
      case '/auth':
        UXAuth._auth(rq, rs)
        break
      case '/newuser':
        rs.render('diva/newuser', {
          title: 'New User',
          arrayUser: User.allAsArray()
        })
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
      const user = User.open(rq.body.account || '', rq.body.password || '')
      session.isAuthenticated = true
      session.account = user.getAccountIdent()
      session.keyPublic = user.getPublicKey()
      if (typeof session.stateView[session.account] === 'undefined') {
        session.stateView[session.account] = {
          pathView: '/',
          uiLanguage: Culture.languageFromRequest(rq)
        }
      }
    } catch (error) {
      Logger.error(error)
    }

    rs.json({
      isAuthenticated: session.isAuthenticated,
      pathView: session.isAuthenticated ? session.stateView[session.account].pathView : '/'
    })
  }
}

module.exports = { UXAuth }

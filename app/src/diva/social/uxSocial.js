/*!
 * diva uxSocial
 * Copyright(c) 2019 Konrad Baechler, https://diva.exchange
 * GPL3 Licensed
 */

'use strict'

import { UXMain } from '../uxMain'
import { ChatDb } from './chatDb'
import { Messaging } from './messaging'

export class UXSocial extends UXMain {
  /**
   * Factory
   *
   * @param server {HttpServer}
   * @returns {UXSocial}
   * @public
   */
  static make (server) {
    return new UXSocial(server)
  }

  /**
   * @param server {HttpServer}
   * @private
   */
  constructor (server) {
    super(server)
    this.chatDb = ChatDb.make()
  }

  /**
   * @param rq {Object} Request
   * @param rs {Object} Response
   * @param n {Function}
   * @public
   */
  execute (rq, rs, n) {
    const session = rq.session
    this.messaging = Messaging.make(session)
    if (!UXMain.isAuth(rq)) {
      return UXMain.redirectAuth(rs)
    }
    if (typeof rq.body.sender !== 'undefined' || typeof rq.body.recipient !== 'undefined') {
      session.chatIdent = rq.body.sender || rq.body.recipient
    }
    switch (rq.path) {
      case '/social/message': {
        if (typeof rq.body.message !== 'undefined' && rq.body.message !== '') {
          this.chatDb.addMessage(session.chatIdent, rq.body.message, rq.body.sent_received)
        }
        this.renderPage(rs, session.chatIdent)
        break
      }
      case '/social/updateAvatar': {
        if (rq.body.profileIdent !== null && rq.body.profileIdent !== '') {
          this.chatDb.updateAvatar(rq.body.profileIdent, rq.body.profileAvatar)
        }
        this.renderPage(rs, session.chatIdent)
        break
      }
      case '/social': {
        this.renderPage(rs, session.chatIdent)
        break
      }
      default:
        n()
    }
  }

  /**
   * @param rs {Object} Response
   * @param chatIdent {String}
   * @public
   */
  renderPage (rs, chatIdent) {
    this.messaging.reloadAccountsFromNode().then(() => {
      rs.render('diva/social/social', {
        title: 'Social',
        arrayMessage: this.chatDb.getMessagesForUser(chatIdent),
        arrayChatFriends: this.chatDb.getAllAccountsFromDB(),
        activeAccount: this.chatDb.getProfile(chatIdent)[0]
      })
    })
  }
}

module.exports = { UXSocial }

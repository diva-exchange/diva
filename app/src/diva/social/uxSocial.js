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

    switch (rq.path) {
      case '/social/sendMessage':
        session.chatIdent = rq.body.chatB32
        if (rq.body.chatMessage && rq.body.chatMessage !== null && rq.body.chatMessage !== '') {
          this.chatDb.addMessage(rq.body.chatB32, rq.body.chatMessage, 1)
          this.messaging.send(rq.body.chatB32, rq.body.chatMessage)
        }
        rs.render('diva/social/social', {
          title: 'Social',
          arrayMessage: this.chatDb.getMessagesForUser(session.chatIdent),
          arrayChatFriends: this.chatDb.getChatFriends(),
          activeAccountIdent: session.chatIdent
        })
        break
      case '/social/addMessage':
        session.chatIdent = rq.body.chatB32
        if (rq.body.chatMessage && rq.body.chatMessage !== null && rq.body.chatMessage !== '') {
          this.chatDb.addMessage(rq.body.chatB32, rq.body.chatMessage, 2)
        }
        rs.render('diva/social/social', {
          title: 'Social',
          arrayMessage: this.chatDb.getMessagesForUser(session.chatIdent),
          arrayChatFriends: this.chatDb.getChatFriends(),
          activeAccountIdent: session.chatIdent
        })
        break
      case '/social':
        rs.render('diva/social/social', {
          title: 'Social',
          arrayMessage: this.chatDb.getMessagesForUser(session.chatIdent),
          arrayChatFriends: this.chatDb.getChatFriends(),
          activeAccountIdent: session.chatIdent
        })
        break
      default:
        n()
    }
  }
}

module.exports = { UXSocial }

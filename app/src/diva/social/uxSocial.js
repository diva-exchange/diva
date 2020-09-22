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
    if (typeof rq.body.accountIdentRecipient !== 'undefined') {
      session.chatIdent = rq.body.accountIdentRecipient
    }
    switch (rq.path) {
      case '/social/sendMessage': {
        const b32Address = this.chatDb.getProfile(session.chatIdent)[0].b32_address
        if (typeof rq.body.chatMessage !== 'undefined' && rq.body.chatMessage !== '' &&
            typeof b32Address !== 'undefined' && b32Address !== '') {
          this.chatDb.addMessage(session.chatIdent, rq.body.chatMessage, 1)
          const publicKeyRecipient = this.chatDb.getProfile(session.chatIdent)
          // the if statement is for the first not encrypted message - before they exchange it - it will be removed
          if (typeof publicKeyRecipient !== 'undefined' && publicKeyRecipient[0].pub_key !== '') {
            const encryptedMessage = this.messaging.encryptChatMessage(rq.body.chatMessage, publicKeyRecipient[0].pub_key)
            this.messaging.send(rq.body.myAccountIdent, b32Address, encryptedMessage)
          } else {
            this.messaging.send(rq.body.myAccountIdent, b32Address, rq.body.chatMessage, true)
          }
        }
        this.renderPage(rs, session.chatIdent)
        break
      }
      case '/social/addMessage': {
        const receivedProfile = this.chatDb.getProfile(session.chatIdent)[0]
        if (rq.body.chatMessage !== null && rq.body.chatMessage !== '' && session.chatIdent !== '') {
          this.chatDb.setProfile(receivedProfile.account_ident, receivedProfile.b32_address, rq.body.chatPK, receivedProfile.avatar)
          // temporary solution - first message is not encrypted
          if (!rq.body.chatFM) {
            const decryptedMessage = this.messaging.decryptChatMessage(rq.body.chatMessage)
            this.chatDb.addMessage(session.chatIdent, decryptedMessage, 2)
          } else {
            this.chatDb.addMessage(session.chatIdent, rq.body.chatMessage, 2)
          }
        }
        this.renderPage(rs, session.chatIdent)
        break
      }
      case '/social/updateProfile': {
        if (rq.body.profileIdent && rq.body.profileIdent !== null && rq.body.profileIdent !== '') {
          this.chatDb.setProfile(rq.body.profileIdent, rq.body.profileB32, rq.body.profilePk, rq.body.profileAvatar)
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
    rs.render('diva/social/social', {
      title: 'Social',
      arrayMessage: this.chatDb.getMessagesForUser(chatIdent),
      arrayChatFriends: this.chatDb.getChatFriends(),
      activeAccount: this.chatDb.getProfile(chatIdent)[0]
    })
  }
}

module.exports = { UXSocial }

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
      case '/social/sendMessage': {
        session.chatIdent = rq.body.accountIdentRecipient
        const b32Address = this.chatDb.getProfile(rq.body.accountIdentRecipient)[0].b32_address
        if (rq.body.chatMessage && rq.body.chatMessage !== null && rq.body.chatMessage !== '') {
          this.chatDb.addMessage(rq.body.accountIdentRecipient, rq.body.chatMessage, 1)

          const publicKeyRecipient = this.chatDb.getProfile(rq.body.accountIdentRecipient)

          // the if statement is for the first not encrypted message - before they exchange it - it will be removed
          if (typeof publicKeyRecipient !== 'undefined' && publicKeyRecipient[0].pub_key !== '' && publicKeyRecipient[0].pub_key.length !== 0) {
            const encryptedMessage = this.messaging.encryptChatMessage(rq.body.chatMessage, publicKeyRecipient[0].pub_key)
            this.messaging.send(rq.body.myAccountIdent, b32Address, encryptedMessage)
          } else {
            this.messaging.send(rq.body.myAccountIdent, b32Address, rq.body.chatMessage, true)
          }
        }
        rs.render('diva/social/social', {
          title: 'Social',
          arrayMessage: this.chatDb.getMessagesForUser(session.chatIdent),
          arrayChatFriends: this.chatDb.getChatFriends(),
          activeAccount: this.chatDb.getProfile(session.chatIdent)[0]
        })
        break
      }
      case '/social/addMessage': {
        session.chatIdent = rq.body.chatAccount
        const receivedProfile = this.chatDb.getProfile(session.chatIdent)[0]
        if (rq.body.chatMessage && rq.body.chatMessage !== null && rq.body.chatMessage !== '' && rq.body.chatAccount !== '') {
          this.chatDb.setProfile(receivedProfile.account_ident, receivedProfile.b32_address, rq.body.chatPK, receivedProfile.avatar)
          // temporary solution - first message is not encrypted
          if (!rq.body.chatFM) {
            const decryptedMessage = this.messaging.decryptChatMessage(rq.body.chatMessage)
            this.chatDb.addMessage(rq.body.chatAccount, decryptedMessage, 2)
          } else {
            this.chatDb.addMessage(rq.body.chatAccount, rq.body.chatMessage, 2)
          }
        }
        rs.render('diva/social/social', {
          title: 'Social',
          arrayMessage: this.chatDb.getMessagesForUser(session.chatIdent),
          arrayChatFriends: this.chatDb.getChatFriends(),
          activeAccount: receivedProfile
        })
        break
      }
      case '/social/updateProfile': {
        if (rq.body.profileIdent && rq.body.profileIdent !== null && rq.body.profileIdent !== '') {
          this.chatDb.setProfile(rq.body.profileIdent, rq.body.profileB32, rq.body.profilePk, rq.body.profileAvatar)
        }
        rs.render('diva/social/social', {
          title: 'Social',
          arrayMessage: this.chatDb.getMessagesForUser(session.chatIdent),
          arrayChatFriends: this.chatDb.getChatFriends(),
          activeAccount: this.chatDb.getProfile(session.chatIdent)[0]
        })
        break
      }
      case '/social': {
        rs.render('diva/social/social', {
          title: 'Social',
          arrayMessage: this.chatDb.getMessagesForUser(session.chatIdent),
          arrayChatFriends: this.chatDb.getChatFriends(),
          activeAccount: this.chatDb.getProfile(session.chatIdent)[0]
        })
        break
      }
      default:
        n()
    }
  }
}

module.exports = { UXSocial }

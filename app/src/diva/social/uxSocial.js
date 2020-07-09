/*!
 * diva uxSocial
 * Copyright(c) 2019 Konrad Baechler, https://diva.exchange
 * GPL3 Licensed
 */

'use strict'

import { UXMain } from '../uxMain'
import { Chat } from './chat'
import { Network } from '../../network'
import { Environment } from '../../environment'

const API_COMMUNICATION_PORT = 3902

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
    this._network = Network.make()

    this.chat = Chat.make()
    Environment.getI2PApiAddress().then((result) => {
      this.myB32address = result
    }).catch((error) => {
      this.myB32address = 'error_happened_no_result'
      console.log('Error', error)
    })
  }

  /**
   * @param rq {Object} Request
   * @param rs {Object} Response
   * @param n {Function}
   * @public
   */
  execute (rq, rs, n) {
    const session = rq.session
    if (!UXMain.isAuth(rq)) {
      return UXMain.redirectAuth(rs)
    }

    switch (rq.path) {
      case '/social/sendMessage':
        session.chatIdent = rq.body.chatB32
        if (rq.body.chatMessage && rq.body.chatMessage !== null && rq.body.chatMessage !== '') {
          this.chat.addMessage(rq.body.chatB32, rq.body.chatMessage, 1)
          this.sendMessage(rq.body.chatB32, rq.body.chatMessage, session.account, session.keyPublic)
        }
        rs.render('diva/social/social', {
          title: 'Social',
          arrayMessage: this.chat.getMessagesForUser(session.chatIdent),
          arrayChatFriends: this.chat.getChatFriends(),
          activeAccountIdent: session.chatIdent
        })
        break
      case '/social/addMessage':
        session.chatIdent = rq.body.chatB32
        if (rq.body.chatMessage && rq.body.chatMessage !== null && rq.body.chatMessage !== '') {
          this.chat.addMessage(rq.body.chatB32, rq.body.chatMessage, 1)
         }
        rs.render('diva/social/social', {
          title: 'Social',
          arrayMessage: this.chat.getMessagesForUser(session.chatIdent),
          arrayChatFriends: this.chat.getChatFriends(),
          activeAccountIdent: session.chatIdent
        })
        break
      case '/social':
        rs.render('diva/social/social', {
          title: 'Social',
          arrayMessage: this.chat.getMessagesForUser(session.chatIdent),
          arrayChatFriends: this.chat.getChatFriends(),
          activeAccountIdent: session.chatIdent
        })
        break
      default:
        n()
    }
  }

  sendMessage (chatB32, message) {

    this._ws = this._network.getWebsocketToB32(chatB32 + ':' + API_COMMUNICATION_PORT)
    this._ws.on('error', function error (err) {
      console.log('Chat Socket Error : ' + err)
    })

    this._ws.on('open', () => {
      this._ws.send(JSON.stringify({
        command: 'chat',
        sender: this.myB32address,
        message: message // this.chat.encryptChatMessage (message, publicKey)
      }))
    })
  }
}

module.exports = { UXSocial }

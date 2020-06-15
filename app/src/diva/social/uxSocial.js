/*!
 * diva uxSocial
 * Copyright(c) 2019 Konrad Baechler, https://diva.exchange
 * GPL3 Licensed
 */

'use strict'

import { UXMain } from '../uxMain'
import WebSocket from 'ws'
import { Chat } from './chat'
//import { ChatSignal } from './chatSignal'

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

    this.chat = Chat.make()
//    this.chatSignal = ChatSignal.make()

    const webSocketChat = new WebSocket.Server({ port: 45315 })

    webSocketChat.on('connection', function connection (ws, request, client) {
      ws.on('message', function incoming (message) {
        const ip = request.socket.remoteAddress
        console.log(`Received message ${message} from address ${ip} from user ${client}`)
        // this.chat.addMessage(JSON.parse(message).chatName, JSON.parse(message).chatMessage, 2)
      })
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
    if (!this.isAuth(rq)) {
      return this.redirectAuth(rs)
    }

    switch (rq.path) {
      case '/social/newMessage':
        session.chatIdent = rq.body.chatName
        if (rq.body.chatMessage && rq.body.chatMessage !== null && rq.body.chatMessage !== '') {
          this.chat.addMessage(rq.body.chatName, rq.body.chatMessage, 1)
          this.sendMessage(rq.body.chatName, rq.body.chatMessage)
        }

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
    //this.chatSignal.signalServerOpen(session.account)
  }

  sendMessage (name, message) {
    const webSocketChatFriend = new WebSocket('ws://localhost:45315')

    webSocketChatFriend.on('error', function error (err) {
      console.log('Chat Socket Error : ' + err)
    })

    webSocketChatFriend.on('open', function open () {
      webSocketChatFriend.send(JSON.stringify({
        chatName: name,
        chatMessage: message
      })
      )
    })
  }
}

module.exports = { UXSocial }

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
import { Messaging } from './messaging'
import { Logger } from '@diva.exchange/diva-logger'

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

    // this.chat = Chat.make()

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
    if (!UXMain.isAuth(rq)) {
      return UXMain.redirectAuth(rs)
    }

    const session = rq.session
    this._messaging = Messaging.make(session, (bufferData) => {
      this._onChatMessage(bufferData)
    })

    switch (rq.path) {
      case '/social/sendMessage':
        /*session.chatIdent = rq.body.chatName
        if (rq.body.chatMessage && rq.body.chatMessage !== null && rq.body.chatMessage !== '') {
          this.chat.addMessage(rq.body.chatName, rq.body.chatMessage, 1)
          this.sendMessage(rq.body.chatName, rq.body.chatMessage, session.account, session.keyPublic)
        }
        */
        this._messaging.send('6qqy67tcqzjs5cpsrlmje2lvb4efdub6d6jt2jrsyrho3vlfu5cq.b32.i2p:3902', rq.body.chatMessage)
        break
      case '/social':
        rs.render('diva/social/social', {
          title: 'Social',
          arrayMessage: [], //this.chat.getMessagesForUser(session.chatIdent),
          arrayChatFriends: [], // this.chat.getChatFriends(),
          activeAccountIdent: '' // session.chatIdent
        })
        break
      default:
        n()
    }
  }

  sendMessage (name, message, accountIndent, publicKey) {
    let details = this.chat.getConnectionDetails(name)
    const network = Network.make()

    if (details === undefined || details.length === 0) {
      this.chat.addConnectionDetails(name, '6qqy67tcqzjs5cpsrlmje2lvb4efdub6d6jt2jrsyrho3vlfu5cq.b32.i2p:3902', publicKey)
    }

    details = this.chat.getConnectionDetails(name)

    const ws1 = network.getWebsocketToB32(details[0].b32_address)
    ws1.on('error', function error (err) {
      console.log('Chat Socket Error : ' + err)
    })

    ws1.on('open', () => {
      ws1.send(JSON.stringify({
        command: 'chat',
        sender: this.myB32address,
        message: message, // this.chat.encryptChatMessage (message, publicKey, accountIndent),
        pk: publicKey,
        name: name
      }))
    })
  }

  /**
   * @param bufferData {Buffer}
   * @private
   */
  _onChatMessage (bufferData) {
    Logger.trace(bufferData)
    // push data to UI (via UIWebsocket)
  }
}

module.exports = { UXSocial }

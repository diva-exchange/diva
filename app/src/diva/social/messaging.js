/**
 * diva Messaging
 * Copyright(c) 2020 Konrad Baechler, https://diva.exchange
 * GPL3 Licensed
 */

'use strict'

import { Environment } from '../../environment'
import { Network } from '../../network'
import { Logger } from '@diva.exchange/diva-logger'

import WebSocket from 'ws'

export class Messaging {
  /**
   * Factory
   *
   * @param session
   * @param onMessage {Function} Callback
   * @returns {Messaging}
   */
  static make (session, onMessage) {
    return new Messaging(session, onMessage)
  }

  /**
   * @param session
   * @param onMessage {Function}
   * @private
   */
  constructor (session, onMessage) {
    this._identAccount = session.account
    this._publicKey = session.keyPublic
    this._socket = new Map()
    this._onMessage = onMessage
  }

  /**
   * @param toB32 {string}
   * @param message {string}
   */
  send (toB32, message) {
    if (!this._socket.has(toB32)) {
      this._initiate(toB32)
    }

    Logger.trace(this._socket.get(toB32).readyState)

    if (this._socket.get(toB32).readyState !== WebSocket.OPEN) {
      setTimeout(() => { this.send(toB32, message) }, 500)
    } else {
      Logger.trace('Sending: ' + message)

      this._socket.get(toB32).send(JSON.stringify({
        command: 'chat',
        sender: Environment.getI2PApiAddress(),
        message: message, // this.chat.encryptChatMessage (message, publicKey, accountIndent),
        pk: this._publicKey
      }))
    }
  }

  /**
   * @param toB32 {string}
   * @private
   */
  _initiate (toB32) {
    const socket = Network.make().getWebsocketToB32(toB32)

    socket.on('error', (error) => {
      Logger.warn(error)
      socket.close()
    })
    socket.on('close', () => {
      this._socket.delete(toB32)
    })
    socket.on('message', (bufferData) => {
      Logger.trace('Incoming message: ' + bufferData)
      this._onMessage(bufferData)
    })

    this._socket.set(toB32, socket)
  }
}

module.exports = { Messaging }

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

const API_COMMUNICATION_PORT = 3902

export class Messaging {
  /**
   * Factory
   *
   * @param session
   * @param onMessage {Function} Callback
   * @returns {Messaging}
   */
  static make (session) {
    return new Messaging(session)
  }

  /**
   * @param session
   * @param onMessage {Function}
   * @private
   */
  constructor (session) {
    this._identAccount = session.account
    this._publicKey = session.keyPublic
    this._socket = new Map()

    Environment.getI2PApiAddress().then((result) => {
      this.myB32address = result
    }).catch((error) => {
      this.myB32address = 'error_happened_no_result'
      Logger.error('Error - no b32 address :', error)
    })
  }

  /**
   * @param toB32 {string}
   * @param message {string}
   */
  send (toB32, message) {
    if (!this._socket.has(toB32)) {
      this._initiate(toB32)
    }

    if (this._socket.get(toB32).readyState !== WebSocket.OPEN) {
      setTimeout(() => { this.send(toB32, message) }, 500)
    } else {
      this._socket.get(toB32).send(JSON.stringify({
        command: 'chat',
        sender: this.myB32address,
        message: message
      }))
    }
  }

  /**
   * @param toB32 {string}
   * @private
   */
  _initiate (toB32) {
    const socket = Network.make().getWebsocketToB32(toB32 + ':' + API_COMMUNICATION_PORT)

    socket.on('error', (error) => {
      Logger.warn(error)
      socket.close()
    })
    socket.on('close', () => {
      this._socket.delete(toB32)
    })

    this._socket.set(toB32, socket)
  }
}

module.exports = { Messaging }

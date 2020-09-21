/**
 * diva Messaging
 * Copyright(c) 2020 Konrad Baechler, https://diva.exchange
 * GPL3 Licensed
 */

'use strict'

import { Environment } from '../../environment'
import { Network } from '../../network'
import { KeyStore } from '../../key-store'
import { Logger } from '@diva.exchange/diva-logger'

import sodium from 'sodium-native'
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
    this._publicKey = KeyStore.make().get(':keyPublicForChat')
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
  send (myAccountIdent, toB32, message, firstMessage = false) {
    if (!this._socket.has(toB32)) {
      this._initiate(toB32)
    }
    if (this._socket.get(toB32).readyState !== WebSocket.OPEN) {
      setTimeout(() => { this.send(myAccountIdent, toB32, message, firstMessage) }, 500)
    } else {
      this._socket.get(toB32).send(JSON.stringify({
        command: 'chat',
        account: myAccountIdent,
        sender: this.myB32address,
        message: message,
        pubK: this._publicKey.toString('hex'),
        firstM: firstMessage
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

  encryptChatMessage (data, publicKeyRecipient) {
    const bufferM = Buffer.from(data)
    const ciphertext = sodium.sodium_malloc(sodium.crypto_box_SEALBYTES + data.length)
    sodium.crypto_box_seal(ciphertext, bufferM, Buffer.from(publicKeyRecipient, 'hex'))
    return ciphertext.toString('base64')
  }

  decryptChatMessage (data) {
    const bufferC = Buffer.from(data, 'base64')
    const decrypted = sodium.sodium_malloc(bufferC.length - sodium.crypto_box_SEALBYTES)
    const success = sodium.crypto_box_seal_open(decrypted, bufferC, this._publicKey, KeyStore.make().get(':keySecretForChat'))
    return (success && decrypted.toString()) || 'Can not encrypt message.'
  }
}

module.exports = { Messaging }

/**
 * diva Messaging
 * Copyright(c) 2020 Konrad Baechler, https://diva.exchange
 * GPL3 Licensed
 */

'use strict'

import sodium from 'sodium-native'
import WebSocket from 'ws'
import get from 'simple-get'

import { Network } from '../../network'
import { KeyStore } from '../../key-store'
import { ChatDb } from './chatDb'
import { Logger } from '@diva.exchange/diva-logger'
import { Config } from '../../config'

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
    this._chatDb = ChatDb.make()
    this._config = Config.make()
    this._irohaNodeLocal = this._config.getValueByKey('iroha.node.local')

    this.setSocket()
  }

  /**
   * @param toB32 {string}
   * @param message {string}
   */
  send (recipientAccount, message) {
    if (!this._socket.has(this._irohaNodeLocal)) {
      this._initiate()
    }
    if (this._socket.get(this._irohaNodeLocal).readyState !== WebSocket.OPEN) {
      setTimeout(() => { this.send(recipientAccount, message) }, 500)
    } else {
      const publicKeyRecipient = this._chatDb.getProfile(recipientAccount)[0].pub_key
      const encryptedMessage = this.encryptChatMessage(message, publicKeyRecipient)
      this._socket.get(this._irohaNodeLocal).send(JSON.stringify({
        message: encryptedMessage,
        recipient: recipientAccount
      }))
      this._chatDb.addMessage(recipientAccount, message, 1)
    }
  }

  setSocket () {
    if (!this._socket.has(this._irohaNodeLocal)) {
      this._initiate()
    }
    if (this._socket.get(this._irohaNodeLocal).readyState !== WebSocket.OPEN) {
      setTimeout(() => { this.setSocket() }, 500)
    } else {
      const self = this
      this._socket.get(this._irohaNodeLocal).on('message', function incoming (data) {
        const parsedData = JSON.parse(data)
        const decryptedMessage = self.decryptChatMessage(parsedData.message)
        self._chatDb.addMessage(parsedData.sender, decryptedMessage, 2)
      })
    }
  }

  /**
   * @param toB32 {string}
   * @private
   */
  _initiate () {
    const socket = Network.make().getWebsocketToLocalNode()
    socket.on('error', (error) => {
      Logger.warn(error)
      socket.close()
    })
    socket.on('close', () => {
      this._socket.delete(this._irohaNodeLocal)
    })
    this._socket.set(this._irohaNodeLocal, socket)
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

  reloadAccountsFromNode () {
    const url = 'http://' + this._config.getValueByKey('iroha.node.local')
    const path = '/accounts'
    const self = this
    get.concat(url + path, function (err, res, data) {
      if (err) throw err
      const accounts = JSON.parse(data)
      accounts.forEach(element => {
        const accountCurrent = self._chatDb.getProfile(element.account_id)[0]
        if (typeof accountCurrent === 'undefined' && !accountCurrent) {
          self._chatDb.setProfile(element.account_id, element.i2p || '', element.pkUX || '', 'Avatar')
        } else {
          self._chatDb.setProfile(element.account_id, element.i2p || '', element.pkUX || '', accountCurrent.avatar)
        }
      })
    })
  }
}

module.exports = { Messaging }

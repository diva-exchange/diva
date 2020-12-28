/**
 * diva Messaging
 * Copyright(c) 2020 Konrad Baechler, https://diva.exchange
 * GPL3 Licensed
 */

'use strict'

import sodium from 'sodium-native'
import get from 'simple-get'

import { KeyStore } from '../../key-store'
import { ChatDb } from './chatDb'
import { Config } from '../../config'

const ONE_HOUR = 60 * 60

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
    this._chatDb = ChatDb.make()
    this._config = Config.make()
    this._irohaNodeLocal = this._config.getValueByKey('api')
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

  async reloadAccountsFromNode () {
    const url = 'http://' + this._config.getValueByKey('api')
    const path = '/accounts'
    return new Promise((resolve) => {
      get.concat(url + path, (err, res, data) => {
        if (err) throw err
        const accounts = JSON.parse(data)
        let count = 0
        for (const element of accounts) {
          let activate = 0
          if (typeof element.pk !== 'undefined' && (Math.floor(+new Date() / 1000) - element.ping) < ONE_HOUR) {
            activate = 1
          }
          const accountCurrent = this._chatDb.getProfile(element.account_id)[0]
          if (typeof accountCurrent === 'undefined' && !accountCurrent) {
            this._chatDb.setProfile(element.account_id, element.i2p || '', element.pk || '', 'Avatar', activate)
          } else {
            this._chatDb.setProfile(element.account_id, element.i2p || '', element.pk || '', accountCurrent.avatar, activate)
          }
          count += 1
          if (count === accounts.length) {
            resolve()
          }
        }
      })
    })
  }
}

module.exports = { Messaging }

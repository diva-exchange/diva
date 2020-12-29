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
   * @param onMessage {Function} Callback
   * @returns {Messaging}
   */
  static make () {
    return new Messaging()
  }

  /**
   * @param onMessage {Function}
   * @private
   */
  constructor () {
    this._chatDb = ChatDb.make()
    this._config = Config.make()
    this._irohaNodeLocal = this._config.getValueByKey('api')
  }

  encryptChatMessage (data) {
    const objData = JSON.parse(data)
    if (objData.cmd !== 'message') {
      return data
    }
    const publicKeyRecipient = this._chatDb.getProfile(objData.recipient)[0].pub_key
    const bufferM = Buffer.from(objData.message)
    const ciphertext = sodium.sodium_malloc(sodium.crypto_box_SEALBYTES + objData.message.length)
    sodium.crypto_box_seal(ciphertext, bufferM, Buffer.from(publicKeyRecipient, 'hex'))
    objData.message = ciphertext.toString('base64')
    return JSON.stringify(objData)
  }

  decryptChatMessage (data) {
    const objData = JSON.parse(data)
    if (objData.cmd !== 'message') {
      return data
    }
    const bufferC = Buffer.from(objData.message, 'base64')
    const decrypted = sodium.sodium_malloc(bufferC.length - sodium.crypto_box_SEALBYTES)
    const success = sodium.crypto_box_seal_open(
      decrypted,
      bufferC, KeyStore.make().get(':keyPublicForChat'),
      KeyStore.make().get(':keySecretForChat')
    )
    objData.message = (success && decrypted.toString()) || 'Can not decrypt message.'
    return JSON.stringify(objData)
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

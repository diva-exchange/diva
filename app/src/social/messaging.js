/**
 * Copyright (C) 2020 diva.exchange
 *
 * This program is free software: you can redistribute it and/or modify
 * it under the terms of the GNU Affero General Public License as published by
 * the Free Software Foundation, either version 3 of the License, or
 * (at your option) any later version.
 *
 * This program is distributed in the hope that it will be useful,
 * but WITHOUT ANY WARRANTY; without even the implied warranty of
 * MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the
 * GNU Affero General Public License for more details.
 *
 * You should have received a copy of the GNU Affero General Public License
 * along with this program.  If not, see <https://www.gnu.org/licenses/>.
 *
 * Author/Maintainer: Jozef Soti <>
 */

'use strict'

import { ChatDb } from './chatDb'
import { Config } from '../config/config'
import get from 'simple-get'
import { KeyStore } from '../auth/key-store'
import sodium from 'sodium-native'

const ONE_HOUR = 60 * 60

export class Messaging {
  /**
   * Factory
   *
   * @returns {Messaging}
   */
  static make () {
    return new Messaging()
  }

  /**
   * @private
   */
  constructor () {
    this._chatDb = ChatDb.make()
    this._keystore = KeyStore.make()

    // @FIXME architecture issue
    /* create box keypair for chat encryption */
    const pkForChat = sodium.sodium_malloc(sodium.crypto_box_PUBLICKEYBYTES)
    const skForChat = sodium.sodium_malloc(sodium.crypto_box_SECRETKEYBYTES)
    sodium.crypto_box_keypair(pkForChat, skForChat)
    this._keystore.set('social:keyPublic', pkForChat)
    this._keystore.set('social:keySecret', skForChat)

    const pk = this._keystore.get('social:keyPublic')

    const url = 'http://' + Config.make().getValueByKey('api') +
      '/register-ux?key=' + pk.toString('hex') +
      '&token=' + Config.make().getValueByKey('api.token')
    get.concat(url, (error) => {
      if (error) {
        throw new Error(error)
      }
      // @FIXME architecture issue
      this._reloadAccountsFromNode()
    })
  }

  /**
   * @param json {string}
   * @returns {string}
   */
  encryptChatMessage (json) {
    const obj = JSON.parse(json)
    if (obj.command !== 'message') {
      return json
    }
    const publicKeyRecipient = this._chatDb.getProfile(obj.recipient)[0].pub_key
    const bufferM = Buffer.from(obj.message)
    const ciphertext = sodium.sodium_malloc(sodium.crypto_box_SEALBYTES + obj.message.length)
    sodium.crypto_box_seal(ciphertext, bufferM, Buffer.from(publicKeyRecipient, 'hex'))
    obj.message = ciphertext.toString('base64')
    return JSON.stringify(obj)
  }

  /**
   * @param json {string}
   * @returns {string}
   */
  decryptChatMessage (json) {
    const obj = JSON.parse(json)
    if (obj.command !== 'message') {
      return json
    }
    const bufferC = Buffer.from(obj.message, 'base64')
    const decrypted = sodium.sodium_malloc(bufferC.length - sodium.crypto_box_SEALBYTES)
    const success = sodium.crypto_box_seal_open(
      decrypted,
      bufferC,
      this._keystore.get('social:keyPublic'),
      this._keystore.get('social:keySecret')
    )
    obj.message = (success && decrypted.toString()) || 'Can not decrypt message.'
    return JSON.stringify(obj)
  }

  /**
   * @returns {Promise<any>}
   */
  _reloadAccountsFromNode () {
    const url = 'http://' + Config.make().getValueByKey('api')
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
          const accountCurrent = this._chatDb.getProfile(element.accountId)[0]
          if (typeof accountCurrent === 'undefined' && !accountCurrent) {
            this._chatDb.setProfile(element.accountId, element.i2p || '', element.pk || '', 'Avatar', activate)
          } else {
            this._chatDb.setProfile(element.accountId, element.i2p || '', element.pk || '', accountCurrent.avatar, activate)
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

/*!
 * diva uxSocial
 * Copyright(c) 2019 Konrad Baechler, https://diva.exchange
 * GPL3 Licensed
 */

'use strict'

import { Db } from '../../db'
import { KeyStore } from '../../key-store'
import sodium from 'sodium-native'

export class Chat {
  static make () {
    return new Chat()
  }

  constructor () {
    this._db = Db.connect()
  }

  /*
    * insert message into database
    *
    */
  addMessage (avatarIndent, message, sentReceived) {
    this._db.insert(`INSERT INTO diva_chat (avatar, message, timestamp_ms, sent_received)
                VALUES (@a, @m, @ts, @sr)`, {
      a: avatarIndent,
      m: message,
      ts: +new Date(),
      sr: sentReceived
    })
  }

  getMessagesForUser (avatarIndent) {
    return this._db.allAsArray('SELECT message, timestamp_ms, sent_received FROM diva_chat WHERE avatar = @avatar',
      {
        avatar: avatarIndent
      })
  }

  getChatFriends () {
    return this._db.allAsArray('SELECT DISTINCT avatar FROM diva_chat_connections')
  }

  getConnectionDetails (avatarIndent) {
    return this._db.allAsArray('SELECT b32_address, pub_key FROM diva_chat_connections WHERE avatar = @avatar',
      {
        avatar: avatarIndent
      })
  }

  addConnectionDetails (avatarIndent, b32Address, pubKey) {
    this._db.insert(`INSERT INTO diva_chat_connections (avatar, b32_address, timestamp_ms, pub_key)
                  VALUES (@a, @b, @ts, @p)`, {
      a: avatarIndent,
      b: b32Address,
      ts: +new Date(),
      p: pubKey
    })
  }

  receivedMessage (data) {
    const details = this.getConnectionDetails(data.name)
    if (details === undefined || details.length === 0) {
      this.addConnectionDetails(data.name, data.sender, data.pk)
    }
    this.addMessage(data.name, data.message, 2)
  }

  encryptChatMessage (data, publicKey, account) {
    const bufferM = Buffer.from(data)
    const bufferC = sodium.sodium_malloc(data.length + sodium.crypto_box_MACBYTES)
    const bufferN = sodium.sodium_malloc(sodium.crypto_box_NONCEBYTES)
    const pk = sodium.sodium_malloc(sodium.crypto_box_SECRETKEYBYTES).fill(Buffer.from(publicKey))
    const sk = sodium.sodium_malloc(sodium.crypto_box_SECRETKEYBYTES).fill(Buffer.from(KeyStore.make().get(account + ':keyPrivate')))

    sodium.crypto_box_easy(bufferC, bufferM, bufferN, pk, sk)

    return bufferC
  }

  decryptChatMessage (data, publicKey) {
    console.log(KeyStore.make())

    const bufferC = Buffer.from(data)
    const bufferMessage = sodium.sodium_malloc(bufferC.length - sodium.crypto_box_MACBYTES)
    const bufferN = sodium.sodium_malloc(sodium.crypto_box_NONCEBYTES)
    const pk = sodium.sodium_malloc(sodium.crypto_box_SECRETKEYBYTES).fill(Buffer.from(publicKey))
    const sk = sodium.sodium_malloc(sodium.crypto_box_SECRETKEYBYTES).fill(Buffer.from(KeyStore.make().get(':keyPrivate')))

    sodium.crypto_box_open_easy(bufferMessage, bufferC, bufferN, pk, sk)

    return bufferMessage.toString()
  }
}

module.exports = { Chat }

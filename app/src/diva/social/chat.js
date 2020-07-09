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

  constructor (identAccount) {
    this.identAccount = identAccount
    this._db = Db.connect()
  }

  /*
    * insert message into database
    *
    */
  addMessage (b32Address, message, sentReceived) {
    this._db.insert(`INSERT INTO diva_chat_messages (b32_address, message, timestamp_ms, sent_received)
                VALUES (@a, @m, @ts, @sr)`, {
      a: b32Address,
      m: message,
      ts: +new Date(),
      sr: sentReceived
    })
  }

  getMessagesForUser (b32Address) {
    return this._db.allAsArray('SELECT message, timestamp_ms, sent_received FROM diva_chat_messages WHERE b32_address = @b32_address',
      {
        b32_address: b32Address
      })
  }

  getChatFriends () {
    return this._db.allAsArray('SELECT DISTINCT b32_address FROM diva_chat_messages')
  }

  getProfile (b32Address) {
    return this._db.allAsArray('SELECT * FROM diva_chat_profile WHERE b32_address = @b32_address',
    {
      b32_address: b32Address
    })
  }

  addProfile (avatarIndent, b32Address, pubKey) {
    this._db.insert(`INSERT INTO diva_chat_profile (avatar, b32_address, timestamp_ms, pub_key)
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
    this.addMessage(data.b32_address, data.message, 2)
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

  decryptChatMessage (data, publicKey, account) {
    console.log(KeyStore.make())

    const bufferC = Buffer.from(data)
    const bufferMessage = sodium.sodium_malloc(bufferC.length - sodium.crypto_box_MACBYTES)
    const bufferN = sodium.sodium_malloc(sodium.crypto_box_NONCEBYTES)
    const pk = sodium.sodium_malloc(sodium.crypto_box_SECRETKEYBYTES).fill(Buffer.from(publicKey))
    const sk = sodium.sodium_malloc(sodium.crypto_box_SECRETKEYBYTES).fill(Buffer.from(KeyStore.make().get(account + ':keyPrivate')))

    sodium.crypto_box_open_easy(bufferMessage, bufferC, bufferN, pk, sk)

    return bufferMessage.toString()
  }
}

module.exports = { Chat }

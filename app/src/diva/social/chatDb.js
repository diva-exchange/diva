/*!
 * diva uxSocial
 * Copyright(c) 2019 Konrad Baechler, https://diva.exchange
 * GPL3 Licensed
 */

'use strict'

import { Db } from '../../db'

export class ChatDb {
  static make () {
    return new ChatDb()
  }

  constructor () {
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
}

module.exports = { ChatDb }

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

  getAllAccountsFromDB () {
    return this._db.allAsArray('SELECT account_ident FROM diva_chat_profiles  WHERE active = 1')
  }

  /*
  * insert message into database
  *
  */
  addMessage (accountIdent, message, sentReceived) {
    this._db.insert(`INSERT INTO diva_chat_messages (account_ident, message, timestamp_ms, sent_received)
                VALUES (@a, @m, @ts, @sr)`, {
      a: accountIdent,
      m: message,
      ts: +new Date(),
      sr: sentReceived
    })
  }

  getMessagesForUser (accountIdent) {
    return this._db.allAsArray('SELECT message, timestamp_ms, sent_received FROM diva_chat_messages WHERE account_ident = @account_ident',
      {
        account_ident: accountIdent
      })
  }

  getProfile (accountIdent) {
    return this._db.allAsArray('SELECT * FROM diva_chat_profiles WHERE account_ident = @account_ident',
      {
        account_ident: accountIdent
      })
  }

  setProfile (accountIdent, b32Address, pubKey, avatarIdent, active) {
    this._db.insert(`REPLACE INTO diva_chat_profiles (account_ident, b32_address, timestamp_ms, pub_key, avatar, active)
                  VALUES (@a, @b, @ts, @p, @av, @act)`, {
      a: accountIdent,
      b: b32Address,
      ts: +new Date(),
      p: pubKey,
      av: avatarIdent,
      act: active
    })
  }

  updateAvatar (profileIdent, profileAvatar) {
    this._db.update(`UPDATE diva_chat_profiles SET
        avatar = @avatar
      WHERE
        account_ident = @account_ident`,
    {
      avatar: profileAvatar,
      account_ident: profileIdent
    })
  }
}

module.exports = { ChatDb }

/*!
 * diva uxSocial
 * Copyright(c) 2019 Konrad Baechler, https://diva.exchange
 * GPL3 Licensed
 */

'use strict'

import { Db } from '../../db'
import { IrohaDb } from '../../api/iroha-db'

export class ChatDb {
  static make () {
    return new ChatDb()
  }

  constructor () {
    this._db = Db.connect()
    this._initIrohaDB()
  }

  async _initIrohaDB () {
    this._irohaDb = await IrohaDb.make()
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

  getChatFriends () {
    const arrayAccounts = this._irohaDb.getAccounts()
    arrayAccounts.then((result) => {
      let i = 0
      result.forEach(element => {
        const accountCurrent = this.getProfile(element.match(/[^@]*/i)[0])[0]
        if (typeof accountCurrent === 'undefined' && !accountCurrent) {
          this.setProfile(element.match(/[^@]*/i)[0], '', '', 'Avatar')
        }
      })
    })
    return this._db.allAsArray('SELECT account_ident FROM diva_chat_profiles')
  }

  getProfile (accountIdent) {
    return this._db.allAsArray('SELECT * FROM diva_chat_profiles WHERE account_ident = @account_ident',
      {
        account_ident: accountIdent
      })
  }

  setProfile (accountIdent, b32Address, pubKey, avatarIdent) {
    this._db.insert(`REPLACE INTO diva_chat_profiles (account_ident, b32_address, timestamp_ms, pub_key, avatar)
                  VALUES (@a, @b, @ts, @p, @av)`, {
      a: accountIdent,
      b: b32Address,
      ts: +new Date(),
      p: pubKey,
      av: avatarIdent
    })
  }
}

module.exports = { ChatDb }

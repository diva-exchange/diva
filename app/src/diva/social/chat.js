/*!
 * diva uxSocial
 * Copyright(c) 2019 Konrad Baechler, https://diva.exchange
 * GPL3 Licensed
 */

'use strict'

import { Db } from '../../db'

export class Chat {
  static make () {
    return new Chat()
  }

  constructor (identAccount, identContract) {
    this._db = Db.connect()
  }

  /*
    * insert message into database
    *
    */
  addMessage (name, message, sendReceived) {
    this._db.insert(`INSERT INTO diva_chat (account_ident, message, timestamp_ms, sent_received)
                VALUES (@a, @m, @ts, @sr)`, {
      a: name,
      m: message,
      ts: +new Date(),
      sr: sendReceived
    })
  }

  getMessagesForUser (accountIdent) {
    return this._db.allAsArray('SELECT message, timestamp_ms, sent_received FROM diva_chat WHERE account_ident = @account_ident',
      {
        account_ident: accountIdent
      })
  }

  getChatFriends () {
    return this._db.allAsArray('SELECT DISTINCT account_ident FROM diva_chat')
  }
}

module.exports = { Chat }

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

import { Db } from '../db'

export class ChatDb {
  /**
   * Factory
   * @returns {ChatDb}
   */
  static make () {
    return new ChatDb()
  }

  /**
   * Constructor
   */
  constructor () {
    this._db = Db.connect()
  }

  /**
   * @returns {Array}
   */
  getAllAccountsFromDB () {
    return this._db.allAsArray('SELECT account_ident FROM diva_chat_profiles WHERE active = 1')
  }

  /**
   * @param accountIdent
   * @param message
   * @param sentReceived
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

  /**
   * @param accountIdent
   * @returns {Array}
   */
  getMessagesForUser (accountIdent) {
    return this._db.allAsArray('SELECT message, timestamp_ms, sent_received FROM diva_chat_messages WHERE account_ident = @account_ident',
      {
        account_ident: accountIdent
      })
  }

  /**
   * @param accountIdent
   * @returns {Array}
   */
  getProfile (accountIdent) {
    return this._db.allAsArray('SELECT * FROM diva_chat_profiles WHERE account_ident = @account_ident',
      {
        account_ident: accountIdent
      })
  }

  /**
   * @param accountIdent
   * @param b32Address
   * @param pubKey
   * @param avatarIdent
   * @param active
   */
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

  /**
   * @param profileIdent
   * @param profileAvatar
   */
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

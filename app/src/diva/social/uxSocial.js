/*!
 * diva uxSocial
 * Copyright(c) 2019 Konrad Baechler, https://diva.exchange
 * GPL3 Licensed
 */

'use strict'

import { Db } from '../../db'
import { UXMain } from '../uxMain'

export class UXSocial extends UXMain {
  /**
   * Factory
   *
   * @param server {HttpServer}
   * @returns {UXSocial}
   * @public
   */
  static make (server) {
    return new UXSocial(server)
  }

  /**
   * @param server {HttpServer}
   * @private
   */
  constructor (server) {
    super(server)
    this._db = Db.connect()
  }

  /**
   * @param rq {Object} Request
   * @param rs {Object} Response
   * @param n {Function}
   * @public
   */
  execute (rq, rs, n) {
    const session = rq.session
    if (!this.isAuth(rq)) {
      return this.redirectAuth(rs)
    }

    switch (rq.path) {

      case '/social/newMessage':
        session.chatIdent = rq.body.chatName;
        if (rq.body.chatMessage && rq.body.chatMessage != null && rq.body.chatMessage != '') {
            this.addMessage(rq.body.chatName, rq.body.chatMessage)
      }
      case '/social':
        rs.render('diva/social/social', {
            title: 'Social',
            arrayMessage: this.getMessagesForUser(session.chatIdent),
            arrayChatFriends: this.getChatFriends(),
            activeAccountIdent: session.chatIdent
        })
        break
      default:
        n()
    }
  }

  addMessage (name, message) {
    this._db.insert(`INSERT INTO diva_chat (account_ident, message, timestamp_ms, sent_received)
            VALUES (@a, @m, @ts, @sr)`, {
        a: name,
        m: message,
        ts: +new Date,
        sr: 1
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

module.exports = { UXSocial }

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

import { UXMain } from '../uxMain'
import { ChatDb } from '../../social/chatDb'
import { Messaging } from '../../social/messaging'

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

    this.chatDb = ChatDb.make()
    this.messaging = Messaging.make()

    this.server.setFilterWebsocketLocal('chat', (json) => {
      // store the message in the database
      const obj = JSON.parse(json)
      this.chatDb.addMessage(obj.recipient, obj.message, 1)
      return this.messaging.encryptChatMessage(json)
    })
    this.server.setFilterWebsocketApi('chat', (json) => {
      json = this.messaging.decryptChatMessage(json)
      const obj = JSON.parse(json)
      // store the message in the database
      this.chatDb.addMessage(obj.sender, obj.message, 2)
      return json
    })
  }

  /**
   * @param rq {Object} Request
   * @param rs {Object} Response
   * @param n {Function}
   * @public
   */
  execute (rq, rs, n) {
    super.execute(rq, rs, n)

    switch (rq.path) {
      case '/social':
        rs.render('diva/social/social', {
          title: 'Social',
          arrayMessage: this.chatDb.getMessagesForUser(this.config.getValueByKey('iroha.account')),
          arrayChatFriends: this.chatDb.getAllAccountsFromDB(),
          activeAccount: this.chatDb.getProfile(this.config.getValueByKey('iroha.account'))[0]
        })
        break
      default:
        n()
    }
    /*
    switch (rq.path) {
      case '/social/updateAvatar': {
        if (rq.body.profileIdent !== null && rq.body.profileIdent !== '') {
          this.chatDb.updateAvatar(rq.body.profileIdent, rq.body.profileAvatar)
        }
        this.renderPage(rs, session.chatIdent)
        break
      }
      case '/social': {
        this.renderPage(rs, session.chatIdent)
        break
      }
      default:
        n()
    }
    */
  }

  /**
   * @param rs {Object} Response
   * @param chatIdent {String}
   * @public
   */
  /*
  renderPage (rs, chatIdent) {
    this.messaging.reloadAccountsFromNode().then(() => {
      rs.render('diva/social/social', {
        title: 'Social',
        arrayMessage: this.chatDb.getMessagesForUser(chatIdent),
        arrayChatFriends: this.chatDb.getAllAccountsFromDB(),
        activeAccount: this.chatDb.getProfile(chatIdent)[0]
      })
    })
  }
  */
}

module.exports = { UXSocial }

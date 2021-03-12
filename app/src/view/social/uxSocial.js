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
   * @param {HttpServer} server
   * @return {UXSocial}
   * @public
   */
  static make (server) {
    return new UXSocial(server)
  }

  /**
   * @param {HttpServer} server
   * @private
   */
  constructor (server) {
    super(server)

    this.chatDb = ChatDb.make()
    this.messaging = Messaging.make()

    this.server.setFilterWebsocketLocal('chat', (obj) => {
      // store the message in the database
      this.chatDb.addMessage(obj.recipient, obj.message, 1)
      return this.messaging.encryptChatMessage(obj)
    })
    this.server.setFilterWebsocketApi('chat', (obj) => {
      obj = this.messaging.decryptChatMessage(obj)
      // store the message in the database
      this.chatDb.addMessage(obj.sender, obj.message, 2)
      return obj
    })
  }

  /**
   * @param {Object} rq - Request
   * @param {Object} rs - Response
   * @param {Function} n
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
      case '/social/updateAvatar':
        if (rq.body.profileIdent !== null && rq.body.profileIdent !== '') {
          this.chatDb.updateAvatar(rq.body.profileIdent, rq.body.profileAvatar)
        }
        break
      default:
        n()
    }
  }
}

module.exports = { UXSocial }

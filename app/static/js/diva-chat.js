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

// @see https://umbrellajs.com
/* global u */

// @see https://developer.mozilla.org/en-US/docs/Web/API/WebSocket
/* global WebSocket */

// @see @see https://developer.mozilla.org/en-US/docs/Web/API/Fetch_API
/* global fetch */

if (!u || !fetch || !WebSocket) {
  throw new Error('invalid state')
}

class UiChat {
  /**
   *
   */
  static make () {
    UiChat._attachEvents()
    // connect to local websocket
    UiChat.websocket = new WebSocket('ws://' + document.location.host)
    // Connection opened
    UiChat.websocket.addEventListener('open', () => {
      UiChat.websocket.send(JSON.stringify({
        command: 'subscribe',
        channel: 'chat'
      }))
    })
    // Listen for data
    UiChat.websocket.addEventListener('message', (event) => {
      let objData
      try {
        objData = JSON.parse(event.data)
        UiChat._setHtmlMessages(objData, 'received')
      } catch (error) {
        console.error(error)
      }
    })
    const chatMessages = document.getElementById('chat_messages')
    chatMessages.scrollTop = chatMessages.scrollHeight
  }

  static _attachEvents () {
    u('#chat_message').handle('keyup', (e) => {
      if (e.keyCode === 13) {
        const account = u('ul.chat_accounts_ul li.current_chat').text().trim()
        const messageToSend = u('#chat_message').first().value.trim()
        if (account && messageToSend) {
          UiChat.websocket.send(JSON.stringify({
            channel: 'chat',
            command: 'message',
            recipient: account,
            message: messageToSend
          }))
          UiChat._setHtmlMessages({
            message: messageToSend
          }, 'send')
          u('#chat_message').first().value = ''
        }
      }
    })

    u('#updateProfile').on('click', async () => {
      const account = u('#profile_account_ident').text()
      const avatar = u('#chatIdentAvatar').first().value
      if (account && avatar) {
        await UiChat._postJson('/social/updateAvatar', {
          profileIdent: account.trim(),
          profileAvatar: avatar.trim()
        })
      }
    })
  }

  static _setHtmlMessages (objData, direction) {
    if (direction === 'send') {
      u('#chat_messages ul').append(`<li class="my_message_li"><div class="my_message_div">${objData.message}</div></li>`)
    } else {
      u('#chat_messages ul').append(`<li class="incoming_message_li"><div class="my_message_div incoming_message_div">${objData.message}</div></li>`)
    }
    const chatMessages = document.getElementById('chat_messages')
    chatMessages.scrollTop = chatMessages.scrollHeight
  }

  /**
    * @param uri {string}
    * @param objBody {Object}
    * @returns {Promise<Response>}
    * @private
    */
  static _postJson (uri, objBody) {
    return fetch(uri, {
      method: 'POST',
      headers: {
        Accept: 'application/json',
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(objBody)
    })
  }
}

UiChat.make()

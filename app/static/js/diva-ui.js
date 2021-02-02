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
 * Author/Maintainer: Konrad Bächler <konrad@diva.exchange>
 */

'use strict'

// @see https://umbrellajs.com
/* global u */

// @see ./diva-culture.js
/* global UiCulture */

// @see https://developer.mozilla.org/en-US/docs/Web/API/WebSocket
/* global WebSocket */

if (!u || !WebSocket || !UiCulture) {
  throw new Error('invalid state')
}

class Ui {
  /**
   * @public
   */
  static make () {
    Ui._attachEvents()

    u('#modal-notification').removeClass('is-active')
    u('#modal-notification .message-header p').text('')
    u('#modal-notification .message-body p').text('')

    // connect to local websocket
    Ui.websocket = new WebSocket('ws://' + document.location.host)

    // Connection opened
    Ui.websocket.addEventListener('open', () => {
      Ui.websocket.send(JSON.stringify({
        channel: 'block',
        command: 'subscribe'
      }))
    })

    // Listen for data
    Ui.websocket.addEventListener('message', async (event) => {
      let block = {}
      try {
        block = JSON.parse(event.data).block
        u('#blockheight').text(block.blockV1.payload.height)
        u('#blocktime').data('culture-datetime', block.blockV1.payload.createdTime)
          .text(block.blockV1.payload.createdTime)
        await UiCulture.translate()
      } catch (error) {
        console.error(error)
      }
    })
  }

  /**
   * @param urlScript {string}
   * @param onLoad {Function|null}
   * @param onError {Function|null}
   * @public
   */
  static load (urlScript, onLoad = null, onError = null) {
    // check if DOM is already available
    if (document.readyState === 'complete' || document.readyState === 'interactive') {
      Ui._load(urlScript, onLoad, onError)
    } else {
      document.addEventListener('DOMContentLoaded', () => Ui._load(urlScript, onLoad, onError))
    }
  }

  /**
   * @param urlScript {string}
   * @param onLoad {Function|null}
   * @param onError {Function|null}
   * @private
   */
  static _load (urlScript, onLoad, onError) {
    const element = document.createElement('script')
    if (typeof onLoad === 'function') {
      element.onload = () => {
        onLoad(urlScript)
      }
    }
    element.onerror = () => {
      if (typeof onError !== 'function') {
        throw new Error(urlScript)
      } else {
        onError(urlScript)
      }
    }
    element.async = true
    element.src = urlScript
    u('body').append(element)
  }

  /**
   * @param identAccount {string}
   * @public
   */
  static setIdentAccount (identAccount) {
    Ui._identAccount = identAccount
  }

  /**
   * @public
   */
  static getIdentAccount () {
    return Ui._identAccount || ''
  }

  /**
   * @param header {string}
   * @param body {string}
   */
  static message (header, body) {
    u('#modal-notification .message-header p').text(header)
    u('#modal-notification .message-body p').text(body)
    u('#modal-notification').addClass('is-active')
  }

  /**
   * @private
   */
  static _attachEvents () {
    u('#modal-notification .modal-background, #modal-notification button.delete').off('click')
      .handle('click', () => {
        u('#modal-notification').removeClass('is-active')
        u('#modal-notification .message-header p').text('')
        u('#modal-notification .message-body p').text('')
      })
  }
}

// check if DOM is already available
if (document.readyState === 'complete' || document.readyState === 'interactive') {
  // call on next available tick
  setTimeout(Ui.make, 1)
} else {
  document.addEventListener('DOMContentLoaded', Ui.make)
}

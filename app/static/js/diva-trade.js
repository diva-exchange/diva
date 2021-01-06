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

// Umbrella, @see https://umbrellajs.com
var _u = u || false
// Generic UI class, @see ./diva-ui.js
var _Ui = Ui || false
// Generic UiCulture class, @see ./diva-ui.js
var _UiCulture = UiCulture || false
// WebSocket client API, @see https://developer.mozilla.org/en-US/docs/Web/API/WebSocket
var _WebSocket = WebSocket || false
// fetch API, @see https://developer.mozilla.org/en-US/docs/Web/API/Fetch_API
var _fetch = fetch || false

if (!_u || !_Ui || !_UiCulture || !_WebSocket || !_fetch) {
  throw new Error('invalid state')
}

class UiTrade {
  /**
   * Factory
   * @public
   */
  static make () {
    UiTrade.CHANNEL_ORDER = 'order'

    UiTrade._attachEvents()

    // connect to local websocket
    UiTrade.websocket = new _WebSocket((document.location.protocol === 'https:' ? 'wss://' : 'ws://') +
      document.location.host)
    UiTrade.identContract = _u('select#contract').first().value

    // Connection opened
    UiTrade.websocket.addEventListener('open', () => {
      UiTrade.websocket.send(JSON.stringify({
        channel: UiTrade.CHANNEL_ORDER,
        command: 'subscribe'
      }))

      UiTrade.websocket.send(JSON.stringify({
        channel: UiTrade.CHANNEL_ORDER,
        command: 'getBook'
      }))
    })

    // Listen for data
    UiTrade.websocket.addEventListener('message', async () => {
      try {
        await _UiCulture.translate()
      } catch (error) {
        window.location.replace('/logout')
      }
    })
  }

  /**
   * @private
   */
  static _attachEvents () {
    _u('#place-order').text(_u('#order .tabs li.is-active a').text())
    _u('#order button, #orderbook button').removeClass('is-loading is-disabled')

    // contract
    _u('#contract').off('change').handle('change', (e) => {
      _u(e.target).parent().addClass('is-loading is-disabled')
      _u('#price').first().value = ''
      _u('#amount').first().value = ''
      UiTrade._changeContract(e.target.value).then(() => {
        setTimeout(() => { _u(e.target).parent().removeClass('is-loading is-disabled') }, 200)
      })
    })

    // order action
    _u('#order .tabs li').off('click').handle('click', (e) => {
      _u(e.currentTarget).siblings().removeClass('is-active')
      _u(e.currentTarget).addClass('is-active')
      _u('#order').data('type', _u(e.currentTarget).data('type'))
      _u('#place-order').text(_u('#order .tabs li.is-active a').text())
    })

    // buy/sell action
    _u('#place-order').off('click').handle('click', () => {
      _u('#place-order').addClass('is-loading is-disabled')
      UiTrade._order(_u('#order').data('type'))
      _u('#place-order').removeClass('is-loading is-disabled')
    })

    // delete action
    _u('#orderbook button[name=delete]').off('click').handle('click', (e) => {
      e.stopPropagation()
      _u(e.currentTarget).addClass('is-loading is-disabled')
      UiTrade._delete(_u(e.currentTarget).data('type'), _u(e.currentTarget).data('timestamp_ms'))
    })

    // delete-all action
    _u('#orderbook button[name=delete-all]').off('click').handle('click', (e) => {
      e.stopPropagation()
      _u(e.currentTarget).addClass('is-loading is-disabled')
      UiTrade._delete(_u(e.currentTarget).data('type'), 0)
    })
  }

  /**
   * @param {string} identContract
   * @returns {Promise<void>}
   * @private
   */
  static async _changeContract (identContract) {
    const response = await UiTrade._postJson('/trade/contract/set', {
      identContract: identContract
    })

    return UiTrade._handleResponse(response)
  }

  /**
   * @param {string} type
   * @private
   */
  static _order (type) {
    const json = {
      channel: UiTrade.CHANNEL_ORDER,
      command: 'add',
      type: type,
      price: _u('#price').first().value,
      amount: _u('#amount').first().value
    }

    UiTrade.websocket.send(JSON.stringify(json))
  }

  /**
   * @param {number} msTimestamp
   * @param {string} type
   * @private
   */
  static _delete (type, msTimestamp) {
    const json = {
      channel: UiTrade.CHANNEL_ORDER,
      command: 'delete',
      type: type,
      msTimestamp: msTimestamp
    }

    UiTrade.websocket.send(JSON.stringify(json))
  }

  /**
   * @param {Object} res - Response
   * @param {string} type
   * @returns {Promise<void>}
   * @private
   */
  static async _handleResponse (res, type = undefined) {
    if (!res.ok) {
      res.text().then((html) => _Ui.message('ERROR', html))
    }
  }

  /**
   * @param {string} uri
   * @param {Object} objBody
   * @returns {Promise<Response>}
   * @private
   */
  static _postJson (uri, objBody) {
    return _fetch(uri, {
      method: 'POST',
      headers: {
        Accept: 'application/json',
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(objBody)
    })
  }

  /**
   * @param {Object} objData
   * @private
   */
  static _setHtmlOrderBook (objData) {
    let html = ''
    let rowBid = []
    let rowAsk = []
    do {
      rowBid = objData.bid.shift()
      rowAsk = objData.ask.shift()
      if (rowBid || rowAsk) {
        let buttonDeleteBid = ''
        if (rowBid) {
          buttonDeleteBid = `
            <button class="button is-small"
              name="delete" data-timestamp_ms="${rowBid[2]}" data-type="B">
              <span class="icon is-medium"><i class="fas fa-lg fa-times"></i></span>
            </button>`
        }
        let buttonDeleteAsk = ''
        if (rowAsk) {
          buttonDeleteAsk = `
            <button class="button is-small"
              name="delete" data-timestamp_ms="${rowAsk[2]}" data-type="A">
              <span class="icon is-medium"><i class="fas fa-lg fa-times"></i></span>
            </button>`
        }
        html += `
          <tr>
            <td>${buttonDeleteBid}</td>
            <td class="has-text-right amount">${rowBid ? rowBid[1] : ''}</td>
            <td class="has-text-right price">${rowBid ? rowBid[0] : ''}</td>
            <td class="price">${rowAsk ? rowAsk[0] : ''}</td>
            <td class="amount">${rowAsk ? rowAsk[1] : ''}</td>
            <td>${buttonDeleteAsk}</td>
          </tr>
          <tr class="timestamp">
            <td></td>
            <td colspan="2" class="has-text-right" data-culture-datetime="${rowBid ? rowBid[2] : ''}">
                ${rowBid ? rowBid[2] : ''}
            </td>
            <td colspan="2" data-culture-datetime="${rowAsk ? rowAsk[2] : ''}">
                ${rowAsk ? rowAsk[2] : ''}
            </td>
            <td></td>
          </tr>`
      }
    } while (rowBid || rowAsk)
    _u('#orderbook tbody').html(html)

    UiTrade._attachEvents()
  }

  /**
   * @param {Object} objData
   * @private
   */
  static _setHtmlMarket (objData) {
    let html = ''
    let rowBid = []
    let rowAsk = []
    do {
      rowBid = objData.bid.shift()
      rowAsk = objData.ask.shift()
      if (rowBid || rowAsk) {
        html += `
          <tr>
            <td class="has-text-right">${rowBid ? rowBid[1] : ''}</td>
            <td class="has-text-right">${rowBid ? rowBid[0] : ''}</td>
            <td class="">${rowAsk ? rowAsk[0] : ''}</td>
            <td class="">${rowAsk ? rowAsk[1] : ''}</td>
          </tr>
          <tr class="timestamp">
            <td colspan="2" class="has-text-right" data-culture-datetime="${rowBid ? rowBid[2] : ''}">
                ${rowBid ? rowBid[2] : ''}
            </td>
            <td colspan="2" data-culture-datetime="${rowAsk ? rowAsk[2] : ''}">
                ${rowAsk ? rowAsk[2] : ''}
            </td>
          </tr>`
      }
    } while (rowBid || rowAsk)

    _u('#market').html(html)
  }
}

UiTrade.make()

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

// @see ./diva-ui.js
/* global Ui */

// @see ./diva-culture.js
/* global UiCulture */

// @see https://developer.mozilla.org/en-US/docs/Web/API/WebSocket
/* global WebSocket */

// @see @see https://developer.mozilla.org/en-US/docs/Web/API/Fetch_API
/* global fetch */

if (!u || !Ui || !UiCulture || !WebSocket || !fetch) {
  throw new Error('invalid state')
}

class UiTrade {
  /**
   * Factory
   * @public
   */
  static make () {
    UiTrade.TYPE_BID = 'B'
    UiTrade.TYPE_ASK = 'A'

    UiTrade.CHANNEL_ORDER = 'order'
    UiTrade.COMMAND_SUBSCRIBE = 'subscribe'
    UiTrade.COMMAND_GETBOOK = 'getBook'
    UiTrade.COMMAND_ADD = 'add'
    UiTrade.COMMAND_DELETE = 'delete'
    UiTrade.COMMAND_CONFIRM = 'confirm'

    UiTrade.CLASS_PENDING_ADDITION = 'pending-addition'
    UiTrade.CLASS_PENDING_DELETION = 'pending-deletion'

    UiTrade.bid = []
    UiTrade.ask = []

    UiTrade._attachEvents()

    // connect to local websocket
    UiTrade.websocket = new WebSocket((document.location.protocol === 'https:' ? 'wss://' : 'ws://') +
      document.location.host)
    UiTrade.identContract = u('select#contract').first().value

    // Connection opened
    UiTrade.websocket.addEventListener('open', () => {
      UiTrade.websocket.send(JSON.stringify({
        channel: UiTrade.CHANNEL_ORDER,
        command: UiTrade.COMMAND_SUBSCRIBE
      }))

      UiTrade.websocket.send(JSON.stringify({
        channel: UiTrade.CHANNEL_ORDER,
        command: UiTrade.COMMAND_GETBOOK
      }))
    })

    // Listen for data
    UiTrade.websocket.addEventListener('message', async (event) => {
      try {
        const response = JSON.parse(event.data)
        if (response.error) {
          return console.error(response.error)
        }

        await UiTrade._processResponse (response)

      } catch (error) {
        console.error(error)
      }
    })
  }

  /**
   * @param {Object} response
   * @returns {Promise<void>}
   * @private
   */
  static async _processResponse (response) {
    let book
    let i
    const ident = (response.channel || '') + ':' + (response.command || '')

    switch (ident) {
      case UiTrade.CHANNEL_ORDER + ':' + UiTrade.COMMAND_GETBOOK:
        UiTrade.bid = response.books.B
        UiTrade.bid.length && UiTrade._setHtmlBook(UiTrade.TYPE_BID)

        UiTrade.ask = response.books.A
        UiTrade.ask.length && UiTrade._setHtmlBook(UiTrade.TYPE_ASK)
        break
      case UiTrade.CHANNEL_ORDER + ':' + UiTrade.COMMAND_ADD:
        book = response.type === UiTrade.TYPE_BID ? UiTrade.bid : UiTrade.ask
        book.push({
          timestamp_ms: response.id,
          price: response.price,
          amount: response.amount,
          statusUX: UiTrade.CLASS_PENDING_ADDITION
        })
        book.sort((a, b) => response.type === UiTrade.TYPE_BID ? b.price - a.price : a.price - b.price)

        UiTrade._setHtmlBook(response.type)
        await UiCulture.translate()
        break
      case UiTrade.CHANNEL_ORDER + ':' + UiTrade.COMMAND_DELETE:
        book = response.type === UiTrade.TYPE_BID ? UiTrade.bid : UiTrade.ask
        i = book.findIndex((o) => o.timestamp_ms === response.id)
        i > -1 && (book[i].statusUX = UiTrade.CLASS_PENDING_DELETION )
        UiTrade._setHtmlBook(response.type)
        break
      case UiTrade.CHANNEL_ORDER + ':' + UiTrade.COMMAND_CONFIRM:
        book = response.type === UiTrade.TYPE_BID ? UiTrade.bid : UiTrade.ask
        i = book.findIndex((o) => o.timestamp_ms === response.id)
        if (i < 0) {
          return
        }
        if (u(`#${response.type}${response.id}`).hasClass(UiTrade.CLASS_PENDING_ADDITION)) {
          delete book[i].statusUX
        } else if (u(`#${response.type}${response.id}`).hasClass(UiTrade.CLASS_PENDING_DELETION)) {
          book.splice(i, 1)
        }
        UiTrade._setHtmlBook(response.type)
        break
    }

    await UiCulture.translate()
  }

  /**
   * @private
   */
  static _attachEvents () {
    u('#place-order').text(u('#order .tabs li.is-active a').text())
    u('#order button, #orderbook button').removeClass('is-loading is-disabled')

    // contract
    u('#contract').off('change').handle('change', (e) => {
      u(e.target).parent().addClass('is-loading is-disabled')
      u('#price').first().value = ''
      u('#amount').first().value = ''
      UiTrade._changeContract(e.target.value).then(() => {
        setTimeout(() => { u(e.target).parent().removeClass('is-loading is-disabled') }, 200)
      })
    })

    // order type action (tabs)
    u('#order .tabs li').off('click').handle('click', (e) => {
      u(e.currentTarget).siblings().removeClass('is-active')
      u(e.currentTarget).addClass('is-active')
      u('#order').data('type', u(e.currentTarget).data('type'))
      u('#place-order').text(u('#order .tabs li.is-active a').text())
    })

    // buy/sell action (button)
    u('button#place-order').off('click').handle('click', (e) => {
      u(e.currentTarget).addClass('is-loading is-disabled')
      UiTrade._order(u('#order').data('type'))
      setTimeout(() => u(e.currentTarget).removeClass('is-loading is-disabled'), 200)
    })

    // delete action (button)
    u('.orderbook button[name=delete]').off('click').handle('click', (e) => {
      e.stopPropagation()
      u(e.currentTarget).addClass('is-loading is-disabled')
      UiTrade._delete(u(e.currentTarget).data('type'), u(e.currentTarget).data('timestamp_ms'))
    })

    // delete-all action (button)
    u('button#delete-all-order').off('click').handle('click', (e) => {
      e.stopPropagation()
      u(e.currentTarget).addClass('is-loading is-disabled')
      UiTrade._deleteAll(u('#order').data('type'))
      setTimeout(() => u(e.currentTarget).removeClass('is-loading is-disabled'), 200)
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
    const timestamp_ms = Date.now()
    const price = u('#price').first().value
    const amount = u('#amount').first().value
    if (Number(price) <= 0 || Number(amount) <= 0) {
      return
    }

    const json = {
      id: timestamp_ms,
      channel: UiTrade.CHANNEL_ORDER,
      command: UiTrade.COMMAND_ADD,
      type: type,
      price: price,
      amount: amount
    }

    UiTrade.websocket.send(JSON.stringify(json))
  }

  /**
   * @param {number} id
   * @param {string} type
   * @private
   */
  static _delete (type, id) {
    const json = {
      id: id,
      channel: UiTrade.CHANNEL_ORDER,
      command: UiTrade.COMMAND_DELETE,
      type: type
    }

    UiTrade.websocket.send(JSON.stringify(json))
  }

  /**
   * @param {string} type
   * @private
   */
  static _deleteAll (type) {
    const book = type === UiTrade.TYPE_BID ? UiTrade.bid : UiTrade.ask
    book.forEach(o => { !o.statusUX && UiTrade._delete(type, o.timestamp_ms) })
  }

  /**
   * @param {Object} res - Response
   * @param {string} type
   * @returns {Promise<void>}
   * @private
   */
  static async _handleResponse (res, type = undefined) {
    if (!res.ok) {
      res.text().then((html) => Ui.message('ERROR', html))
    }
  }

  /**
   * @param {string} uri
   * @param {Object} objBody
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

  /**
   * @param {string} type - B (Bid) or A (Ask)
   * @private
   */
  static _setHtmlBook (type) {
    let html = ''

    const a = type === UiTrade.TYPE_BID ? UiTrade.bid : UiTrade.ask

    a.forEach((row) => {
      html += `
        <div id="${type}${row.timestamp_ms}" class="columns price amount is-mobile ${row.statusUX || ''}">
          <div class="column amount">
            <p>${row.amount}</p>
          </div>
          <div class="column price">
            <p>${row.price}</p>
          </div>
        </div>
        <div id="ts${type}${row.timestamp_ms}" class="columns timestamp is-mobile ${row.statusUX || ''}">
          <div class="column is-narrow">
            <button class="delete is-small"
              name="delete" data-timestamp_ms="${row.timestamp_ms}" data-type="${type}">
            </button>
          </div>
          <div class="column timestamp" data-culture-datetime="${row.timestamp_ms}">
            <p>${row.timestamp_ms}</p>              
          </div>
        </div>`
    })

    u(`#orderbook-${type === UiTrade.TYPE_BID ? 'bid' : 'ask'}`).html(html)

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

    u('#market').html(html)
  }
}

UiTrade.make()

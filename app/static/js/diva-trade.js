/*!
 * Diva Trade related UI functions
 * Copyright(c) 2019-2020 Konrad Baechler, https://diva.exchange
 * GPL3 Licensed
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
// Location API, @see https://developer.mozilla.org/en-US/docs/Web/API/Location
var _Location = document.location || false

if (!_u || !_Ui || !_UiCulture || !_WebSocket || !_fetch || !_Location) {
  throw new Error('invalid state')
}

class UiTrade {
  /**
   * Factory
   * @public
   */
  static make () {
    UiTrade._attachEvents()

    // connect to local websocket
    UiTrade.websocket = new _WebSocket('ws://' + document.location.host)
    UiTrade.identContract = _u('select#contract').first().value

    // Connection opened
    UiTrade.websocket.addEventListener('open', () => {
      UiTrade.websocket.send(JSON.stringify({
        command: 'subscribe',
        resource: 'orderbook',
        contract: UiTrade.identContract,
        group: true
      }))
      UiTrade.websocket.send(JSON.stringify({
        command: 'subscribe',
        resource: 'orderbook',
        account: _Ui.getIdentAccount(),
        contract: UiTrade.identContract,
        group: false
      }))
    })

    // Listen for data
    UiTrade.websocket.addEventListener('message', async (event) => {
      let objData
      try {
        objData = JSON.parse(event.data)
        if (objData.identAccount) {
          UiTrade._setHtmlOrderBook(objData)
        } else if (objData.identContract) {
          UiTrade._setHtmlMarket(objData)
        }
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
      _u('div.data-loader.orderbook').removeClass('fadeout').addClass('fadein')
      _u('div.data-loader.market').removeClass('fadeout').addClass('fadein')
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
    _u('#place-order').off('click').handle('click', async () => {
      _u('div.data-loader.orderbook').removeClass('fadeout').addClass('fadein')
      _u('div.data-loader.market').removeClass('fadeout').addClass('fadein')
      _u('#place-order').addClass('is-loading is-disabled')
      await UiTrade._order(_u('#order').data('type'))
      _u('#place-order').removeClass('is-loading is-disabled')
    })

    // delete action
    _u('#orderbook button[name=delete]').off('click').handle('click', async (e) => {
      e.stopPropagation()
      _u('div.data-loader.orderbook').removeClass('fadeout').addClass('fadein')
      _u('div.data-loader.market').removeClass('fadeout').addClass('fadein')
      _u(e.currentTarget).addClass('is-loading is-disabled')
      await UiTrade._delete(_u(e.currentTarget).data('type'), _u(e.currentTarget).data('timestamp_ms'))
    })

    // delete-all action
    _u('#orderbook button[name=delete-all]').off('click').handle('click', async (e) => {
      e.stopPropagation()
      _u('div.data-loader.orderbook').removeClass('fadeout').addClass('fadein')
      _u('div.data-loader.market').removeClass('fadeout').addClass('fadein')
      _u(e.currentTarget).addClass('is-loading is-disabled')
      await UiTrade._delete(_u(e.currentTarget).data('type'), 0)
    })
  }

  /**
   * @param identContract {string}
   * @returns {Promise<void>}
   * @private
   */
  static async _changeContract (identContract) {
    UiTrade.websocket.send(JSON.stringify({
      command: 'unsubscribe',
      resource: 'orderbook'
    }))
    UiTrade.identContract = identContract

    const response = await UiTrade._postJson('/trade/contract/set', {
      identContract: identContract
    })

    UiTrade.websocket.send(JSON.stringify({
      command: 'subscribe',
      resource: 'orderbook',
      contract: UiTrade.identContract,
      group: true
    }))
    UiTrade.websocket.send(JSON.stringify({
      command: 'subscribe',
      resource: 'orderbook',
      account: _Ui.getIdentAccount(),
      contract: UiTrade.identContract,
      group: false
    }))

    return UiTrade._handleResponse(response)
  }

  /**
   * @param type {string}
   * @returns {Promise<void>}
   * @private
   */
  static async _order (type) {
    const response = await UiTrade._postJson('/trade/order/' + (type === 'B' ? 'buy' : 'sell'), {
      identContract: _u('#contract').first().value,
      type: type,
      price: _u('#price').first().value,
      amount: _u('#amount').first().value
    })

    return UiTrade._handleResponse(response, type)
  }

  /**
   * @param type {string}
   * @param msTimestamp {number}
   * @returns {Promise<void>}
   * @private
   */
  static async _delete (type, msTimestamp) {
    const response = await UiTrade._postJson('/trade/delete/' + (type === 'B' ? 'buy' : 'sell'), {
      identContract: _u('#contract').first().value,
      type: type,
      msTimestamp: msTimestamp
    })

    return UiTrade._handleResponse(response, type)
  }

  /**
   * @param res {Object} Response
   * @param type {string}
   * @returns {Promise<void>}
   * @private
   */
  static async _handleResponse (res, type = undefined) {
    if (res.redirected) {
      window.location.replace('/logout')
    } else if (!res.ok) {
      res.text().then((html) => _Ui.message('ERROR', html))
    }
  }

  /**
   * @param uri {string}
   * @param objBody {Object}
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
   * @param objData {Object}
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
    _u('div.data-loader.orderbook').removeClass('fadein').addClass('fadeout')

    UiTrade._attachEvents()
  }

  /**
   * @param objData {Object}
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
    _u('div.data-loader.market').removeClass('fadein').addClass('fadeout')
  }
}

UiTrade.make()

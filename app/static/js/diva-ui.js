/*!
 * Diva Trade related UI functions
 * Copyright(c) 2019-2020 Konrad Baechler, https://diva.exchange
 * GPL3 Licensed
 */

'use strict'

// Umbrella, @see https://umbrellajs.com
var _u = u || false
// WebSocket client API, @see https://developer.mozilla.org/en-US/docs/Web/API/WebSocket
var _WebSocket = WebSocket || false

if (!_u || !_WebSocket) {
  throw new Error('invalid state')
}

class Ui {
  /**
   * @public
   */
  static make () {
    Ui._attachEvents()

    _u('#modal-notification').removeClass('is-active')
    _u('#modal-notification .message-header p').text('')
    _u('#modal-notification .message-body p').text('')

    // connect to local websocket
    Ui.websocket = new _WebSocket('ws://' + document.location.host)

    // Connection opened
    Ui.websocket.addEventListener('open', () => {
      Ui.websocket.send(JSON.stringify({
        command: 'subscribe',
        resource: 'block'
      }))
    })

    // Listen for data
    Ui.websocket.addEventListener('message', async (event) => {
      let objData
      try {
        objData = JSON.parse(event.data)
        _u('#blockheight').text(objData.blockV1.payload.height || '')
        const datetime = objData.blockV1.payload.createdTime || ''
        _u('#blocktime').data('culture-datetime', datetime).text(datetime)
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
    _u('body').append(element)
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
    _u('#modal-notification .message-header p').text(header)
    _u('#modal-notification .message-body p').text(body)
    _u('#modal-notification').addClass('is-active')
  }

  /**
   * @private
   */
  static _attachEvents () {
    _u('#modal-notification .modal-background, #modal-notification button.delete').off('click')
      .handle('click', () => {
        _u('#modal-notification').removeClass('is-active')
        _u('#modal-notification .message-header p').text('')
        _u('#modal-notification .message-body p').text('')
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

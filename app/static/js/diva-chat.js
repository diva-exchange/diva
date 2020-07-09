
'use strict'

// Umbrella, @see https://umbrellajs.com
var _u = u || false
// fetch API, @see https://developer.mozilla.org/en-US/docs/Web/API/Fetch_API
var _fetch = fetch || false
// WebSocket client API, @see https://developer.mozilla.org/en-US/docs/Web/API/WebSocket
var _WebSocket = WebSocket || false

if (!_u || !_fetch || !_WebSocket) {
  throw new Error('invalid state')
}

class UiChat {
  static make () {
    // connect to local websocket
    UiChat.websocket = new _WebSocket('ws://' + document.location.host)

    // Connection opened
    UiChat.websocket.addEventListener('open', () => {
      UiChat.websocket.send(JSON.stringify({
        command: 'subscribe',
        resource: 'chat'
      }))
    })
    // Listen for data
    UiChat.websocket.addEventListener('message', async (event) => {
      let objData
      try {
        objData = JSON.parse(event.data)
        // output data here
        console.log(objData)
      } catch (error) {
        window.location.replace('/logout')
      }
    })

    _u('#sendMessage').on('click', async e => {
      const response = await UiChat._postJson('/social/sendMessage', {
        chatB32: _u('#chatContactName').first().value,
        chatMessage: _u('#chatMessage').first().value
      })

      location.reload()
      var chatMessages = document.getElementById('chatMessages')
      chatMessages.scrollTop = chatMessages.scrollHeight
    })

    _u('ul.chat_accounts_ul li').on('click', async e => {
      const response = await UiChat._postJson('/social/sendMessage', {
        chatB32: _u(e.target).text(),
        chatMessage: ''
      })

      location.reload()
      var chatMessages = document.getElementById('chatMessages')
      chatMessages.scrollTop = chatMessages.scrollHeight
    })
    _u('#chatContactName').first().value = _u('.current_chat').text()
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
}

UiChat.make()

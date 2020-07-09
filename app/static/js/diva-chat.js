
'use strict'

// Umbrella, @see https://umbrellajs.com
var u = u || false
// fetch API, @see https://developer.mozilla.org/en-US/docs/Web/API/Fetch_API
var fetch = fetch || false
// WebSocket client API, @see https://developer.mozilla.org/en-US/docs/Web/API/WebSocket
var _WebSocket = WebSocket || false

if (!u || !fetch) {
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

    u('#sendMessage').on('click', async e => {
      const response = await UiChat._postJson('/social/sendMessage', {
        chatName: u('#chatContactName').first().value,
        chatMessage: u('#chatMessage').first().value
      })

      location.reload()
      var chatMessages = document.getElementById('chatMessages')
      chatMessages.scrollTop = chatMessages.scrollHeight
    })

    u('ul.chat_accounts_ul li').on('click', async e => {
      const response = await UiChat._postJson('/social/sendMessage', {
        chatName: u(e.target).text(),
        chatMessage: ''
      })

      location.reload()
      var chatMessages = document.getElementById('chatMessages')
      chatMessages.scrollTop = chatMessages.scrollHeight
    })
    u('#chatContactName').first().value = u('.current_chat').text()
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

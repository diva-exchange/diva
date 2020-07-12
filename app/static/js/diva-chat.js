
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
    UiChat._attachEvents()
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
        objData.sender = objData.sender.split(':')[0]
        await UiChat._postJson('/social/addMessage', {
          chatB32: objData.sender,
          chatMessage: objData.message
        })
        UiChat._setHtmlMessages(objData, true)
      } catch (error) {
        window.location.replace('/logout')
      }
    })
  }

  static _setHtmlMessages (objData, received = false) {
    let found = false
    let html = ''
    if (received) {
      _u('ul.chat_accounts_ul li').each((node, i) => {
        if (node.innerText === objData.sender) {
          found = true
        }
      })
      if (!found) {
        _u('ul.chat_accounts_ul').append(`<li class="current_chat">${objData.sender}</li>`)
      }
      if (_u('ul.chat_accounts_ul li.current_chat').text() === objData.sender) {
        html += `<li>${objData.message}</li>`
      }
    } else {
      html += `<li class="my_message">${objData.message}</li>`
    }
    _u('#chatMessages ul').append(html)
  }

  static _attachEvents () {
    _u('#sendMessage').on('click', async e => {
      const b32Address = _u('#chatContactName').first().value ? _u('#chatContactName').first().value : _u('ul.chat_accounts_ul li.current_chat').text()
      await UiChat._postJson('/social/sendMessage', {
        chatB32: b32Address,
        chatMessage: _u('#chatMessage').first().value
      })

      UiChat._setHtmlMessages({
        message: _u('#chatMessage').first().value,
        sender: _u('#chatContactName').first().value
      })
      var chatMessages = document.getElementById('chatMessages')
      chatMessages.scrollTop = chatMessages.scrollHeight
      _u('#chatMessage').first().value = ''
    })

    _u('ul.chat_accounts_ul li').on('click', async e => {
      await UiChat._postJson('/social/sendMessage', {
        chatB32: _u(e.target).text(),
        chatMessage: ''
      })

      document.location.reload()
      var chatMessages = document.getElementById('chatMessages')
      chatMessages.scrollTop = chatMessages.scrollHeight
    })
    _u('#chatContactName').first().value = _u('.current_chat').text()

    _u('#chatMessage').handle('keyup', function (event) {
      if (event.keyCode === 13) {
        _u('#sendMessage').trigger('click')
      }
    })
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

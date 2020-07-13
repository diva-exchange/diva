
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
    UiChat.attachEventWithReload()
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
    _u('ul.chat_accounts_ul li').each((node, i) => {
      if (node.innerText === objData.sender) {
        found = true
      }
    })
    if (!found) {
      _u('ul.chat_accounts_ul li').each((node, i) => {
        if (_u(node).hasClass('current_chat')) {
          _u(node).removeClass('current_chat')
        }
      })
      _u('ul.chat_accounts_ul').append(`<li class="current_chat">${objData.sender}</li>`)
      UiChat.attachEventWithReload()
    }
    if (received) {
      html += `<li class="incoming_message_li"><div class="incoming_message_div">${objData.message}</div></li>`
    } else {
      html += `<li class="my_message_li"><div class="my_message_div">${objData.message}</div></li>`
    }
    if (found && _u('ul.chat_accounts_ul li.current_chat').text() === objData.sender) {
      _u('#chatMessages ul').append(html)
    } else {
      _u('#chatMessages ul').html(html)
    }
    var chatMessages = document.getElementById('chatMessages')
    chatMessages.scrollTop = chatMessages.scrollHeight
  }

  static _attachEvents () {
    // send message on click Send
    _u('#sendMessage').on('click', async e => {
      const b32Address = _u('#chatContactName').first().value ? _u('#chatContactName').first().value : _u('ul.chat_accounts_ul li.current_chat').text()
      const messageToSend = _u('#chatMessage').first().value
      if (b32Address && messageToSend) {
        await UiChat._postJson('/social/sendMessage', {
          chatB32: b32Address,
          chatMessage: messageToSend
        })
        UiChat._setHtmlMessages({
          message: _u('#chatMessage').first().value,
          sender: b32Address
        })
        _u('#chatMessage').first().value = ''
        _u('#chatContactName').first().value = ''
      }
    })
    // send message on Enter
    _u('#chatMessage').handle('keyup', function (event) {
      if (event.keyCode === 13) {
        _u('#sendMessage').trigger('click')
      }
    })
  }

  static attachEventWithReload () {
    // refresh message history with chosen b32 address
    _u('ul.chat_accounts_ul li').on('click', async e => {
      const b32Address = _u(e.target).text()
      if (b32Address) {
        await UiChat._postJson('/social/sendMessage', {
          chatB32: b32Address,
          chatMessage: ''
        })
        document.location.reload()
      }
      var chatMessages = document.getElementById('chatMessages')
      chatMessages.scrollTop = chatMessages.scrollHeight
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

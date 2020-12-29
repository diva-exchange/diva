
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
        channel: 'chat'
      }))
    })
    // Listen for data
    UiChat.websocket.addEventListener('message', async (event) => {
      let objData
      try {
        objData = JSON.parse(event.data)
        UiChat._setHtmlMessages(objData, 'received')
        UiChat._storeData(objData, 2)
      } catch (error) {
        console.error(error)
      }
    })
    const chatMessages = document.getElementById('chat_messages')
    chatMessages.scrollTop = chatMessages.scrollHeight
  }

  static _attachEvents () {
    _u('#chat_message').handle('keyup', async e => {
      if (e.keyCode === 13) {
        const account = _u('ul.chat_accounts_ul li.current_chat').text().trim()
        const messageToSend = _u('#chat_message').first().value.trim()
        if (account && messageToSend) {
          UiChat.websocket.send(JSON.stringify({
            command: 'message',
            channel: 'chat',
            recipient: account,
            message: messageToSend
          }))
          UiChat._setHtmlMessages({
            message: messageToSend
          }, 'send')
          _u('#chat_message').first().value = ''
          UiChat._storeData({
            recipient: account,
            message: messageToSend
          }, 1)
        }
      }
    })

    _u('#updateProfile').on('click', async e => {
      const account = _u('#profile_account_ident').text()
      const avatar = _u('#chatIdentAvatar').first().value
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
      _u('#chat_messages ul').append(`<li class="my_message_li"><div class="my_message_div">${objData.message}</div></li>`)
    } else {
      _u('#chat_messages ul').append(`<li class="incoming_message_li"><div class="my_message_div incoming_message_div">${objData.message}</div></li>`)
    }
    const chatMessages = document.getElementById('chat_messages')
    chatMessages.scrollTop = chatMessages.scrollHeight
  }

  static _storeData (objData, direction) {
    UiChat._postJson('/social/message', {
      sender: objData.sender,
      recipient: objData.recipient,
      message: objData.message,
      sent_received: direction
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

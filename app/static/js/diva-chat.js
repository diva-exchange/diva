
'use strict'

// Umbrella, @see https://umbrellajs.com
const _u = u || false
// fetch API, @see https://developer.mozilla.org/en-US/docs/Web/API/Fetch_API
const _fetch = fetch || false
// WebSocket client API, @see https://developer.mozilla.org/en-US/docs/Web/API/WebSocket
const _WebSocket = WebSocket || false

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
          accountIdentRecipient: objData.account,
          chatB32: objData.sender,
          chatMessage: objData.message,
          chatPK: objData.pubK,
          chatFM: objData.firstM
        })
        location = ''
      } catch (error) {
        window.location.replace('/logout')
      }
    })
    const chatMessages = document.getElementById('chat_messages')
    chatMessages.scrollTop = chatMessages.scrollHeight
  }

  static _attachEvents () {
    // send message on Enter
    _u('#chat_message').handle('keyup', async e => {
      if (e.keyCode === 13) {
        const account = _u('ul.chat_accounts_ul li.current_chat').text().trim()
        const messageToSend = _u('#chat_message').first().value.trim()
        const myAccount = _u('#account').html().trim().match(/[^@]*/i)[0]
        if (account && messageToSend) {
          await UiChat._postJson('/social/sendMessage', {
            myAccountIdent: myAccount,
            accountIdentRecipient: account,
            chatMessage: messageToSend
          })
          UiChat._setHtmlMessages({
            message: messageToSend
          })
          _u('#chat_message').first().value = ''
        }
      }
    })

    _u('#updateProfile').on('click', async e => {
      const account = _u('#profile_account_ident').first().value ? _u('#profile_account_ident').first().value : _u('ul.chat_accounts_ul li.current_chat').text()
      const avatar = _u('#chatIdentAvatar').first().value
      if (account && avatar) {
        await UiChat._postJson('/social/updateAvatar', {
          profileIdent: account.trim(),
          profileAvatar: avatar.trim()
        })
      }
      location = ''
    })
  }

  static attachEventWithReload () {
    // refresh message history with chosen account
    _u('ul.chat_accounts_ul li').on('click', async e => {
      const account = _u(e.target).text()
      if (account) {
        await UiChat._postJson('/social/sendMessage', {
          accountIdentRecipient: account,
          chatMessage: ''
        })
        location = ''
      }
    })
  }

  static _setHtmlMessages (objData) {
    _u('#chat_messages ul').append(`<li class="my_message_li"><div class="my_message_div">${objData.message}</div></li>`)
    const chatMessages = document.getElementById('chat_messages')
    chatMessages.scrollTop = chatMessages.scrollHeight
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

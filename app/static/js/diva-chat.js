
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
          chatAccount: objData.account,
          chatB32: objData.sender,
          chatMessage: objData.message,
          chatPK: objData.pubK,
          chatFM: objData.firstM
        })

        document.location.reload()
      } catch (error) {
        window.location.replace('/logout')
      }
    })
  }

  static _attachEvents () {
    // send message on click Send
    _u('#send_message').on('click', async e => {
      const account = _u('#profile_account_ident').first().value ? _u('#profile_account_ident').first().value : _u('ul.chat_accounts_ul li.current_chat').text().trim()
      const messageToSend = _u('#chat_message').first().value.trim()
      const myAccount = _u('#account').html().trim().match(/[^@]*/i)[0]
      if (account && messageToSend) {
        await UiChat._postJson('/social/sendMessage', {
          myAccountIdent: myAccount,
          accountIdentRecipient: account,
          chatMessage: messageToSend
        })
        UiChat._setHtmlMessages({
          message: messageToSend,
          sender: account
        })
        _u('#chat_message').first().value = ''
        _u('#chat_profile_B32').first().value = ''
      }
    })
    // send message on Enter
    _u('#chat_message').handle('keyup', function (event) {
      if (event.keyCode === 13) {
        _u('#send_message').trigger('click')
      }
    })

    _u('#updateProfile').on('click', async e => {
      const account = _u('#profile_account_ident').first().value ? _u('#profile_account_ident').first().value : _u('ul.chat_accounts_ul li.current_chat').text()
      const b32Address = _u('#chat_profile_B32').first().value
      const avatar = _u('#chatIdentAvatar').first().value
      const pk = _u('#chatContactPK').first().value
      if (account || b32Address) {
        await UiChat._postJson('/social/updateProfile', {
          profileIdent: account.trim(),
          profileB32: b32Address.trim(),
          profileAvatar: avatar.trim(),
          profilePk: pk.trim()
        })
      }
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
        document.location.reload()
      }
      var chatMessages = document.getElementById('chat_messages')
      chatMessages.scrollTop = chatMessages.scrollHeight
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
      _u('#chat_messages ul').append(html)
    } else {
      _u('#chat_messages ul').html(html)
    }
    var chatMessages = document.getElementById('chat_messages')
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

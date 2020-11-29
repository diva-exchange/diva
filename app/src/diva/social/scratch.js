'use strict'

import WebSocket from 'ws'

const _ws = new WebSocket('ws://172.20.101.201:19012')
_ws.on('open', function open() {
  _ws.send(JSON.stringify({
    message: 'hey - unencrypted',
    recipient: 'd75lhmx93jvzb5ig3xdjk8lk91fpvaja@testnet',
  }))
})

_ws.on('message', function incoming(data) {
  console.log(data)
})
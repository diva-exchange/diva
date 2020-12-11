'use strict'

import WebSocket from 'ws'

const _ws = new WebSocket('ws://172.20.101.201:19012')
_ws.on('open', function open () {
  _ws.send(JSON.stringify({
    message: 'hey - unencrypted',
    recipient: 'patqbtgxlleoqentwjnmizgmo@testnet.diva.i2p'
  }))
})

_ws.on('message', function incoming (data) {
  console.log(data)
})

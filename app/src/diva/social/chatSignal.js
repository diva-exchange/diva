/*!
 * diva uxSocial
 * GPL3 Licensed
 */

'use strict'

import WebSocket from 'ws'

const SIGNALING_SERVER = 'http://localhost:3903/'

// const webSocketSignal = new WebSocket(SIGNALING_SERVER)

export class ChatSignal {
  static make () {
    return new ChatSignal()
  }

  constructor () {

  }

  signalServerOpen (channel = 'diva-channel') {
    webSocketSignal.on('open', function open () {
      webSocketSignal.send(JSON.stringify({
        open: true,
        channel: channel
      })
      )
    })

    webSocketSignal.on('message', function incoming (message) {
      JSON.parse(message.data)
      console.log(JSON.stringify(message))
    })
  }

  detectCompanions (channel = 'diva-channel') {
    webSocketSignal.on('message', function incoming (message) {
      message = JSON.parse(message)

      if (message.isChannelPresent === false) {
        // connection.open();
      } else {
        // connection.join(channel);
      }
    })

    webSocketSignal.on('open', function open () {
      webSocketSignal.send(JSON.stringify({
        checkPresence: true,
        channel: channel
      })
      )
    })
  }
}

module.exports = { WebSocket }

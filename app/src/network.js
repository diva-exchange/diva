/*!
 * Diva Network
 * Copyright(c) 2020 Konrad Baechler, https://diva.exchange
 * GPL3 Licensed
 */

'use strict'

import SocksProxyAgent from 'socks-proxy-agent'
import WebSocket from 'ws'
import Peer from 'simple-peer'
import wrtc from 'wrtc'

import { Config } from './config'
import { shuffleArray } from './utils'
import { Logger } from '@diva.exchange/diva-logger'

const WEBSOCKET_CLIENT_OPTIONS = { followRedirects: false, perMessageDeflate: false }

const MIN_CONNECTION_RATIO = 0.5
const MAX_REFRESH_NETWORK_MS = 5 * 60 * 1000 // 5 minutes

export class Network {
  /**
   * @returns {Network}
   */
  static make () {
    if (!Network._instance) {
      Network._instance = new Network()
    }

    return Network._instance
  }

  /**
   * @private
   */
  constructor () {
    this._config = Config.make()
    this._websockets = new Map()
    this._availableWebsocketPeers = []
    this._deadWebsocketPeers = []
    this._ratio = 0
    this._refreshNetwork()
  }

  /**
   * @private
   */
  _refreshNetwork () {
    (async () => {
      await Promise.all(
        this._config.getValueByKey('diva.websocket').map((peer) => {
          return new Promise((resolve) => {
            const options = Object.assign({}, WEBSOCKET_CLIENT_OPTIONS)
            if (peer.match(/^.+\.i2p(:[\d]+)?$/)) {
              options.agent = new SocksProxyAgent('socks://' + this._config.getValueByKey('i2p.socks.proxy'))
            }
            const socket = new WebSocket('ws://' + peer, '', options)

            socket.once('open', () => {
              this._websockets.set(peer, true)
              resolve()
            })
            socket.once('error', () => {
              this._websockets.set(peer, false)
              resolve()
            })
          })
        })
      )
      this._availableWebsocketPeers = Array.from(this._websockets).filter(v => v[1]).map(v => v[0])
      this._deadWebsocketPeers = Array.from(this._websockets).filter(v => !v[1]).map(v => v[0])
      this._ratio = this._availableWebsocketPeers.length > 0
        ? this._availableWebsocketPeers.length / this._websockets.size : 0
      setTimeout(() => { this._refreshNetwork() }, (Math.pow(this._ratio, 3) * MAX_REFRESH_NETWORK_MS) + 1000)
    })()
  }

  /**
   * @param threshold
   * @returns {Promise<void>}
   */
  async waitFor (threshold = MIN_CONNECTION_RATIO) {
    return new Promise((resolve) => {
      const _isAvailable = () => {
        if (this.isAvailable(threshold)) {
          resolve()
        } else {
          setTimeout(_isAvailable, 1000)
        }
      }
      _isAvailable()
    })
  }

  /**
   * @param threshold {number}
   * @returns {boolean}
   */
  isAvailable (threshold = 0) {
    return this._ratio > 0 && this._ratio >= threshold
  }

  /**
   * @returns {WebSocket}
   * @throws {Error}
   */
  getWebsocket () {
    if (!this.isAvailable()) {
      throw new Error('No websocket available')
    }
    const peer = shuffleArray(this._availableWebsocketPeers)[0]
    const options = Object.assign({}, WEBSOCKET_CLIENT_OPTIONS)
    if (peer.match(/^.+\.i2p(:[\d]+)?$/)) {
      options.agent = new SocksProxyAgent('socks://' + this._config.getValueByKey('i2p.socks.proxy'))
    }
    Logger.trace('Network.getWebsocket(): ' + peer)
    return new WebSocket('ws://' + peer, '', options)
  }

  initiateChat(fromPeerB32, toPeerB32) {

      console.log(fromPeerB32 + " to => " + toPeerB32)

      const websocket = new WebSocket('wss://signal.diva.exchange', {
        perMessageDeflate: false
      })

      websocket.on('open', () => {
          websocket.send(JSON.stringify({
            type: 'register',
            from: fromPeerB32,
            to: toPeerB32
          }))
      })

      const peers = {}

      websocket.on('message', (message) => {
        let obj = {}
        try {
          obj = JSON.parse(message)
        } catch (error) {
          return
        }

          const _id = obj.from + ':' + obj.to
          console.log(_id)
        switch (obj.type) {
            case 'init':
            case 'rcpt':
              peers[_id] = new Peer({
                config: { iceServers: [{ urls: 'stun:kopanyo.com:3478' }] },
                initiator: obj.type === 'init',
                wrtc: wrtc
              })
              peers[_id].on('error', (error) => {
                console.log('ERROR', error)
                peers[_id] = false
              })
              // this is incoming from STUN/TURN
              peers[_id].on('signal', (data) => {
                const json = JSON.stringify({
                  type: 'signal',
                  signal: data,
                  from: ident,
                  to: obj.to
                })
                console.log('SIGNAL', json)
                websocket.send(json)
              })
              peers[_id].on('connect', () => {
                // wait for 'connect' event before using the data channel
                peers[_id].send('hey ' + obj.to + ', how is it going? Greetings, ' + obj.from)
              })
              peers[_id].on('data', (data) => {
                // got a data channel message
                console.log('got data: ' + data)
              })
              break
            case 'signal':
              if (peers[_id]) {
                peers[_id].signal(obj.data)
              }
              break
            default:
              break
          }

      })
    }


}

module.exports = { Network }

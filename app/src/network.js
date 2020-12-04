/*!
 * Diva Network
 * Copyright(c) 2020 Konrad Baechler, https://diva.exchange
 * GPL3 Licensed
 */

'use strict'

import SocksProxyAgent from 'socks-proxy-agent'
import WebSocket from 'ws'

import { Config } from './config'
import { shuffleArray } from './utils'

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

            socket.addEventListener('open', () => {
              this._websockets.set(peer, true)
              resolve()
            }, { once: true })
            socket.addEventListener('error', () => {
              this._websockets.set(peer, false)
              resolve()
            }, { once: true })
          })
        })
      )
      this._availableWebsocketPeers = Array.from(this._websockets).filter(v => v[1]).map(v => v[0])
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
    return new WebSocket('ws://' + peer, '', options)
  }

  /**
   * @param b32 {String}
   * @returns {WebSocket}
   */
  getWebsocketToB32 (b32) {
    const options = Object.assign({}, WEBSOCKET_CLIENT_OPTIONS)
    options.agent = new SocksProxyAgent('socks://' + this._config.getValueByKey('i2p.socks.proxy'))
    return new WebSocket('ws://' + b32, '', options)
  }

  /**
     * @returns {WebSocket}
     */
  getWebsocketToLocalNode () {
    const options = Object.assign({}, WEBSOCKET_CLIENT_OPTIONS)
    // options.agent = new SocksProxyAgent('socks://' + this._config.getValueByKey('i2p.socks.proxy'))
    return new WebSocket('ws://172.20.101.201:19012', '', options)
  }
}

module.exports = { Network }

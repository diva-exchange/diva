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
    this._availableWebsocketPeers = []
  }

  /**
   * @returns {WebSocket}
   * @throws {Error}
   */
  getWebsocket () {
    const peer = shuffleArray(this._availableWebsocketPeers)[0]
    const options = Object.assign({}, WEBSOCKET_CLIENT_OPTIONS)
    if (peer.match(/^.+\.i2p(:[\d]+)?$/)) {
      options.agent = new SocksProxyAgent('socks://' + this._config.getValueByKey('i2p.socks.proxy'))
    }
    return new WebSocket('ws://' + peer, '', options)
  }

  /**
   * @returns {WebSocket}
   */
  getWebsocketToLocalNode () {
    const options = Object.assign({}, WEBSOCKET_CLIENT_OPTIONS)
    return new WebSocket('ws://' + this._config.getValueByKey('api'), '', options)
  }
}

module.exports = { Network }

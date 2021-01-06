/**
 * Copyright (C) 2020 diva.exchange
 *
 * This program is free software: you can redistribute it and/or modify
 * it under the terms of the GNU Affero General Public License as published by
 * the Free Software Foundation, either version 3 of the License, or
 * (at your option) any later version.
 *
 * This program is distributed in the hope that it will be useful,
 * but WITHOUT ANY WARRANTY; without even the implied warranty of
 * MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the
 * GNU Affero General Public License for more details.
 *
 * You should have received a copy of the GNU Affero General Public License
 * along with this program.  If not, see <https://www.gnu.org/licenses/>.
 *
 * Author/Maintainer: Konrad Bächler <konrad@diva.exchange>
 */

'use strict'

import SocksProxyAgent from 'socks-proxy-agent'
import WebSocket from 'ws'

import { Config } from './config/config'
import { shuffleArray } from './utils/utils'

const WEBSOCKET_CLIENT_OPTIONS = { followRedirects: false, perMessageDeflate: false }

export class Network {
  /**
   * @return {Network}
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
   * @return {WebSocket}
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
   * @return {WebSocket}
   */
  getWebsocketToLocalNode () {
    const options = Object.assign({}, WEBSOCKET_CLIENT_OPTIONS)
    options.headers = { 'diva-auth-token': 'wJUonoCx5nNwu15CnQ/ErfyScAE/Gs338bWRHJMfxc0=' }
    return new WebSocket('ws://' + this._config.getValueByKey('api'), '', options)
  }
}

module.exports = { Network }

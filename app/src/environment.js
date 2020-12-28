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

import net from 'net'
import request from 'request-promise-native'

import { Config } from './config'

export class Environment {
  /**
   * Whether the blockchain is available on the network
   *
   * @returns {Promise<boolean>}
   */
  static async hasBlockchain () {
    return Environment._isAvailableNetworkService(Config.make().getValueByKey('iroha.torii'))
      .then(() => true)
      .catch(() => false)
  }

  /**
   * @returns {Promise<string|boolean>}
   */
  static async getI2PApiAddress () {
    const response = await request({
      url: Config.make().getValueByKey('i2p.webconsole.scraper.url')
    })
    // Base32 alphabet, [a-z2-7]+
    return response.match(/api.+?([a-z2-7]+\.b32\.i2p:[\d]+)/)[1] || false
  }

  /**
   * Check whether a service on the network is listening
   *
   * @param host {string} hostname:port, like localhost:443
   * @returns {Promise<void>}
   * @private
   */
  static _isAvailableNetworkService (host) {
    return new Promise((resolve, reject) => {
      const [hostname, port] = host.split(':', 2)
      const socket = net.connect({ port: port, host: hostname }, () => {
        socket.end()
        resolve()
      })
        .on('error', (error) => {
          reject(new Error(error))
        })
    })
  }
}

module.exports = { Environment }

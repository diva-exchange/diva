/*!
 * Diva Environment
 * Copyright(c) 2020 Konrad Baechler, https://diva.exchange
 * GPL3 Licensed
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
    return response.match(/local-api.+?([a-z2-7]+\.b32\.i2p:[\d]+)/)[1] || false
  }

  /**
   * @returns {Promise<string|boolean>}
   */
  static async getI2PProfileAddress () {
    const response = await request({
      url: Config.make().getValueByKey('i2p.webconsole.scraper.url')
    })
    // Base32 alphabet, [a-z2-7]+
    return response.match(/local-profile.+?([a-z2-7]+\.b32\.i2p:[\d]+)/)[1] || false
  }

  /**
   * Check whether a service on the network is listening
   *
   * @param host {string} hostname:port, like localhost:443
   * @returns {Promise<void>}
   * @private
   */
  static async _isAvailableNetworkService (host) {
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

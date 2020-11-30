/*!
 * Diva Config
 * Copyright(c) 2019-2020 Konrad Baechler, https://diva.exchange
 * GPL3 Licensed
 */

'use strict'

import { Db } from './db'
import get from 'simple-get'

export class Config {
  /**
   * @returns {Config}
   * @public
   */
  static make () {
    if (!Config._instance) {
      Config._instance = new Config()
    }
    return Config._instance
  }

  /**
   * @private
   */
  constructor () {
    this._db = Db.connect()
    this._data = []
    this._db.allAsArray('SELECT * FROM config').forEach((row) => {
      this._data[row.key] = row.value
    })
  }

  /**
   *
   * @param key {string}
   * @returns {(string|number|Object|Array|undefined)}
   * @public
   */
  getValueByKey (key) {
    if (process.env.NODE_ENV === 'development') {
      const kd = key + '.' + process.env.NODE_ENV
      key = typeof this._data[kd] !== 'undefined' ? kd : key
    }
    if (typeof this._data[key] === 'undefined') {
      return undefined
    }
    try {
      return JSON.parse(this._data[key])
    } catch (error) {
      return this._data[key]
    }
  }

  getMyIrohaAccount () {
    const url = 'http://' + this.getValueByKey('iroha.node.local')
    return new Promise((resolve, reject) => {
      get.concat(url, function (err, res, data) {
        if (err) throw err
        const result = JSON.parse(data)
        resolve(result.account)
      })
    })
  }
}

module.exports = { Config }

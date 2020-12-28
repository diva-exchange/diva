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
    this._refresh()
    this._setMyIrohaAccount()
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

  /**
   * @private
   */
  _refresh () {
    this._data = []
    this._db.allAsArray('SELECT * FROM config').forEach((row) => {
      this._data[row.key] = row.value
    })
  }

  /**
   * @private
   */
  _setMyIrohaAccount () {
    const url = 'http://' + this.getValueByKey('api') + '/about'
    get.concat(url, (err, res, data) => {
      if (err) throw err
      const result = JSON.parse(data)
      this._db.insert(`REPLACE INTO config (key, value)
           VALUES (@key, @value)`,
      {
        key: 'iroha.account',
        value: result.creator
      })
      this._refresh()
    })
  }

  updatePKOnIroha (pk) {
    const completeUrl = 'http://' + this.getValueByKey('api') + '/register-ux?key=' + pk + '&token=9IzRX8NMxv7ftVpQHXaTrwMXjOGcYPHbtXOfZA1gmFc='
    get.concat(completeUrl, (err, res, data) => {
      if (err) throw err
    })
  }
}

module.exports = { Config }

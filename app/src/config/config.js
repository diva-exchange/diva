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

import { Db } from '../db'

export class Config {
  /**
   * Factory, Singleton
   *
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
    this._loadCache()
  }

  /**
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
   * @param key
   * @param value
   */
  set (key, value) {
    this._db.insert(`REPLACE INTO config (key, value)
         VALUES (@key, @value)`,
    {
      key: key,
      value: value
    })
    this._loadCache()
  }

  /**
   * @private
   */
  _loadCache () {
    this._data = []
    this._db.allAsArray('SELECT * FROM config').forEach((row) => {
      this._data[row.key] = row.value
    })
  }
}

module.exports = { Config }

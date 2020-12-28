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

import sodium from 'sodium-native'

export class KeyStore {
  /**
   * Factory
   *
   * @returns {KeyStore}
   * @public
   */
  static make () {
    if (!KeyStore._instance) {
      KeyStore._instance = new KeyStore()
    }
    return KeyStore._instance
  }

  /**
   * @private
   */
  constructor () {
    this._keystore = new Map()
  }

  /**
   * @param key {string}
   * @param value {*}
   * @public
   */
  set (key, value) {
    this.delete(key)
    if (!(value instanceof Buffer)) {
      value = Buffer.from(value)
    }
    const bufferValue = sodium.sodium_malloc(value.length)
    sodium.sodium_mlock(bufferValue)
    bufferValue.fill(value)
    value.fill(0)
    this._keystore.set(key, bufferValue)
  }

  /**
   * @param key {string}
   * @return {Buffer}
   * @public
   */
  get (key) {
    return this._keystore.get(key)
  }

  /**
   * @param key {string}
   * @public
   */
  delete (key) {
    if (this._keystore.has(key)) {
      sodium.sodium_munlock(this._keystore.get(key))
      this._keystore.delete(key)
    }
  }

  /**
   * @public
   */
  free () {
    this._keystore.forEach((v, k) => {
      sodium.sodium_munlock(v)
      this._keystore.delete(k)
    })
  }
}

module.exports = { KeyStore }

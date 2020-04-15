/*!
 * Secure in-memory key store
 * Copyright(c) 2019-2020 Konrad Baechler, https://diva.exchange
 * GPL3 Licensed
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

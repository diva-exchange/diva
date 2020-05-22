/*!
 * Lab (testnet): Manage orders
 * Copyright(c) 2019 Konrad Baechler, https://diva.exchange
 * GPL3 Licensed
 */

'use strict'

import nanoid from 'nanoid'

import { Logger } from '@diva.exchange/diva-logger'
import { Iroha } from '../api/iroha'

const SIZE_ID = 32

export class Order {
  /**
   * @param asset
   * @param price
   * @param amount
   * @returns {string}
   * @public
   */
  static create (asset, price, amount) {
    const _order = new Order()
    _order._place(asset, price, amount)
    return _order._place(asset, price, amount)
  }

  static delete (id) {
    const _order = new Order(id)
    _order._remove()
  }

  /**
   * @private
   */
  constructor (id) {
    this._id = id || nanoid(SIZE_ID)
    Logger.trace(this._id)
  }

  _place (asset, price, amount) {
    // check validity of asset, price and amount
    return this._id
  }
}

module.exports = { Order }

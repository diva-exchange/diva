/*!
 * Diva Auctioneer
 * Copyright(c) 2020 Konrad Baechler, https://diva.exchange
 * GPL3 Licensed
 */

'use strict'

import { Logger } from 'diva-logger'

import { Db } from '../db'
import { Iroha } from './iroha'

export class Auctioneer {
  /**
   * Factory
   *
   * @returns {Auctioneer}
   */
  static make () {
    return new Auctioneer()
  }

  /**
   * @private
   */
  constructor () {
    this._db = Db.connect()
    this._arrayContract = this._db.allAsArray('SELECT contract_ident FROM contract')

    Iroha.make().then((iroha) => {
      iroha.watch(
        (block) => {
          Logger.trace(block)
        },
        (error) => {
          Logger.trace(error)
        }
      )
      this._iroha = iroha
    })
  }
}

module.exports = { Auctioneer }

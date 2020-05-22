/*!
 * Iroha DB connectivity (world state database)
 * Copyright(c) 2019-2020 Konrad Baechler, https://diva.exchange
 * GPL3 Licensed
 */

'use strict'

import { Client } from 'pg'
import { Logger } from '@diva.exchange/diva-logger'
import util from 'util'
import zlib from 'zlib'

import { Config } from '../config'

const IROHA_RETRY_CONNECTION_MS = 5000

const IROHA_ORDER_VERSION_2 = 2 // base64 encoded object data
const IROHA_ORDER_VERSION_3 = 3 // base64 encoded zlib-deflated object data
export const IROHA_ORDER_VERSION_CURRENT = IROHA_ORDER_VERSION_3

export class IrohaDb {
  /**
   * Factory
   *
   * @returns {Promise<IrohaDb>}
   * @private
   */
  static async make () {
    return new IrohaDb()
  }

  /**
   * @returns {Promise<IrohaDb>}
   * @private
   */
  constructor () {
    this._config = Config.make()
    this._lastRetryConnection = 0

    return this._connect()
  }

  /**
   * @returns {Promise<IrohaDb>}
   * @private
   */
  async _connect () {
    this._client = new Client({
      host: this._config.getValueByKey('postgres.iroha.host'),
      port: parseInt(this._config.getValueByKey('postgres.iroha.port')),
      database: this._config.getValueByKey('postgres.iroha.database'),
      user: this._config.getValueByKey('postgres.iroha.user'),
      password: this._config.getValueByKey('postgres.iroha.password')
    })

    await this._client.connect()

    // only after a successful connection attach an error handler
    this._client.once('error', (error) => {
      Logger.warn(error)
      delete this._client
      const now = Date.now()
      setTimeout(() => { this._connect() },
        (now - this._lastRetryConnection < IROHA_RETRY_CONNECTION_MS) ? IROHA_RETRY_CONNECTION_MS : 1)
      this._lastRetryConnection = now
    })

    return this
  }

  /**
   * @returns {Promise<*>}
   */
  async close () {
    return this._client.end()
  }

  /**
   * @param idAccount {string}
   * @param identContract {string}
   * @param type {string}
   * @returns {Promise<Object>}
   * @public
   */
  async getOrderState (idAccount, identContract, type) {
    const regex = '"ob' + identContract + 't' + type + '"[^"]+"([0-9]+);([^"]+)"'
    const data = await this._client.query(
      'SELECT REGEXP_MATCHES(data::TEXT, $2) AS array FROM account WHERE account_id = $1',
      [idAccount, regex]
    )

    if (data.rowCount !== 1) {
      return []
    }

    return IrohaDb.unpackOrder(parseInt(data.rows[0].array[0]), data.rows[0].array[1])
  }

  /**
   * @param identContract {string} Empty to fetch the markets of all contracts
   * @param type {string} B or A (Bid or Ask), or empty to fetch all
   * @param identAccount {string} Empty to fetch the markets of all accounts
   * @returns {Promise<Array>}
   * @throws {Error}
   */
  async getOrderBook (identContract = '', type = '', identAccount = '') {
    if (identContract === '') {
      identContract = '[A-Z0-9_]{1,32}'
    } else if (!identContract.match(/^[A-Z0-9_]{1,32}$/)) {
      throw new Error('invalid identContract: ' + identContract)
    }
    if (type === '') {
      type = 'BA'
    } else if (!(type === 'B' || type === 'A')) {
      throw new Error('invalid type: ' + type)
    }

    const sql = 'SELECT account_id, REGEXP_MATCHES(data::TEXT, $1, \'g\') AS array FROM account' +
      (identAccount ? ' WHERE account_id = $2' : '')
    const regex = '"ob' + identContract + 't[' + type + ']"[^"]+"([0-9]+);([^"]+)"'
    const data = await this._client.query(sql, identAccount ? [regex, identAccount] : [regex])

    return Promise.all(data.rows.map(async (row) => {
      const objectOrder = await IrohaDb.unpackOrder(parseInt(row.array[0]), row.array[1])
      return {
        identAccount: row.account_id,
        identContract: objectOrder.contract,
        type: objectOrder.type,
        mapCurrent: new Map(objectOrder.arrayCurrent)
      }
    }))
  }

  /**
   * @param idAccount {string}
   * @returns {Promise<string>}
   * @throws {Error}
   */
  async getPublicKey (idAccount) {
    const data = await this._client.query('SELECT public_key FROM account_has_signatory WHERE account_id = $1',
      [idAccount])
    if (data.rowCount !== 1) {
      throw new Error('invalid public key')
    }

    return data.rows[0].public_key
  }

  /**
   * @param version {number}
   * @param data {string}
   * @returns {Promise<Object>}
   * @throws {Error}
   * @public
   */
  static async unpackOrder (version, data) {
    try {
      let inflateRaw

      // versioned data
      switch (version) {
        case IROHA_ORDER_VERSION_2:
          return JSON.parse(Buffer.from(data, 'base64').toString())
        case IROHA_ORDER_VERSION_3:
          inflateRaw = util.promisify(zlib.inflateRaw)
          return JSON.parse((await inflateRaw(Buffer.from(data, 'base64'))).toString())
        default:
          Logger.error('IrohaDb.unpackOrder()').error('unsupported order data version')
      }
    } catch (error) {
      Logger.error('IrohaDb.unpackOrder()').error(error)
    }
    return Promise.resolve({})
  }

  /**
   * @param version {number}
   * @param data {Object|Array}
   * @returns {Promise<string>}
   * @throws {Error}
   * @public
   */
  static async packOrder (version, data) {
    try {
      let deflateRaw

      // versioned data
      switch (version) {
        case IROHA_ORDER_VERSION_2:
          return version + ';' + Buffer.from(JSON.stringify(data)).toString('base64')
        case IROHA_ORDER_VERSION_3:
          deflateRaw = util.promisify(zlib.deflateRaw)
          return version + ';' + (await deflateRaw(Buffer.from(JSON.stringify(data)))).toString('base64')
        default:
          Logger.error('IrohaDb.packOrder()').error('unsupported order data version')
      }
    } catch (error) {
      Logger.error('IrohaDb.packOrder()').error(error)
    }
    return Promise.resolve('')
  }
}

module.exports = { IrohaDb, IROHA_ORDER_VERSION_CURRENT }

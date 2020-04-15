/*!
 * Diva Database Handling
 * Copyright(c) 2019-2020 Konrad Baechler, https://diva.exchange
 * GPL3 Licensed
 */

'use strict'

import fs from 'fs'
import path from 'path'

import Sqlite3Database from 'better-sqlite3'

const NAME_DATABASE_DEFAULT = 'diva'

export class Db {
  /**
   * Create a new database
   *
   * @param {string} nameDatabase
   * @public
   */
  static create (nameDatabase) {
    new Db(nameDatabase, false)._install()
  }

  /**
   * Connect to an existing database
   *
   * @param {string} nameDatabase
   * @returns {Db}
   * @public
   */
  static connect (nameDatabase = '') {
    nameDatabase = nameDatabase || process.env.NAME_DATABASE || NAME_DATABASE_DEFAULT
    if (!Db._instance) {
      Db._instance = {}
    }
    if (!Db._instance[nameDatabase]) {
      Db._instance[nameDatabase] = new Db(nameDatabase)
    }
    return Db._instance[nameDatabase]
  }

  /**
   * @param nameDatabase {string}
   * @param mustExist {boolean}
   * @throws {Error}
   * @private
   */
  constructor (nameDatabase, mustExist = true) {
    this.nameDatabase = nameDatabase

    const _pathDB = path.join(__dirname, `/../data/${this.nameDatabase}.sqlite`)
    if (!mustExist && fs.existsSync(_pathDB)) {
      throw new Error('Database exists')
    }

    /** @type Sqlite3Database */
    this._database = new Sqlite3Database(_pathDB, {
      fileMustExist: mustExist
    })

    // enable foreign keys
    this._database.pragma('foreign_keys = ON')
  }

  /**
   * @returns {Db}
   * @throws {Error}
   * @private
   */
  _install () {
    const pathModel = path.join(__dirname, `/../model/install-${this.nameDatabase}.sql`)
    if (!fs.existsSync(pathModel)) {
      throw new Error('Database model not found: ' + pathModel)
    }
    const sql = fs.readFileSync(pathModel, 'utf8')
    this._database.exec(sql)
    return this
  }

  /**
   * Get current Date/Time, UTC
   *
   * @param format {string} Defaults to %Y-%m-%d %H:%M:%f
   * @returns {string}
   * @throws {Error}
   * @see https://www.sqlite.org/lang_datefunc.html
   */
  getNowUtc (format = '%Y-%m-%d %H:%M:%f') {
    if (!format.match(/^[a-z\-:% ]+$/i)) {
      throw new Error('invalid format')
    }
    return this._database.prepare('SELECT STRFTIME(\'' + format + '\', \'NOW\') as dt').get().dt
  }

  /**
   * Fetch all records as an array
   *
   * @param sqlSelect {string}
   * @param params {Object} Named bind params, like @firstname
   * @param raw {boolean} Set to true to return each row as an array instead of an object, defaults to false
   * @returns {Array}
   * @throws {Error}
   * @public
   * @see https://github.com/JoshuaWise/better-sqlite3/blob/HEAD/docs/api.md#allbindparameters---array-of-rows
   * @see https://github.com/JoshuaWise/better-sqlite3/blob/HEAD/docs/api.md#rawtogglestate---this
   */
  allAsArray (sqlSelect, params = {}, raw = false) {
    return this._database.prepare(sqlSelect).raw(raw).all(params)
  }

  /**
   * Fetch first record as an object
   *
   * @param sqlSelect {string}
   * @param params {Object} Named bind params, like @firstname
   * @returns {Object|undefined} Returns undefined, if no data was found
   * @throws {Error}
   * @public
   * @see https://github.com/JoshuaWise/better-sqlite3/blob/HEAD/docs/api.md#getbindparameters---row
   */
  firstAsObject (sqlSelect, params = {}) {
    return this._database.prepare(sqlSelect).get(params)
  }

  /**
   * Begin Transaction
   */
  begin () {
    this._prepareRun('BEGIN')
  }

  /**
   * Commit Transaction
   */
  commit () {
    this._prepareRun('COMMIT')
  }

  /**
   * Rollback Transaction
   */
  rollback () {
    this._prepareRun('ROLLBACK')
  }

  /**
   * Rollback Transaction
   */
  vacuum () {
    this._prepareRun('VACUUM')
  }

  /**
   * Insert data, pass a valid INSERT SQL statement
   *
   * @param sqlInsert {string} Valid INSERT SQL statement
   * @param params {Object} Named bind params, like @firstname
   * @returns {Object} Info object
   * @see https://github.com/JoshuaWise/better-sqlite3/blob/HEAD/docs/api.md#runbindparameters---object
   * @see https://github.com/JoshuaWise/better-sqlite3/blob/HEAD/docs/api.md#binding-parameters
   */
  insert (sqlInsert, params = {}) {
    return this._prepareRun(sqlInsert, params)
  }

  /**
   * Update data, pass a valid UPDATE SQL statement
   *
   * @param sqlUpdate {string} Valid UPDATE SQL statement
   * @param params {Object} Named bind params, like @firstname
   * @returns {Object} Info object
   * @see https://github.com/JoshuaWise/better-sqlite3/blob/HEAD/docs/api.md#runbindparameters---object
   * @see https://github.com/JoshuaWise/better-sqlite3/blob/HEAD/docs/api.md#binding-parameters
   */
  update (sqlUpdate, params = {}) {
    return this._prepareRun(sqlUpdate, params)
  }

  /**
   * Delete data, pass a valid DELETE SQL statement
   *
   * @param sqlDelete {string} Valid DELETE SQL statement
   * @param params {Object} Named bind params, like @firstname
   * @returns {Object} Info object
   * @see https://github.com/JoshuaWise/better-sqlite3/blob/HEAD/docs/api.md#runbindparameters---object
   * @see https://github.com/JoshuaWise/better-sqlite3/blob/HEAD/docs/api.md#binding-parameters
   */
  delete (sqlDelete, params = {}) {
    return this._prepareRun(sqlDelete, params)
  }

  /**
   * @param sql {string} Valid SQL statement
   * @param params {Object} Named bind params, like @firstname
   * @returns {Object} Info object
   * @private
   */
  _prepareRun (sql, params = {}) {
    return this._database.prepare(sql).run(params)
  }
}

module.exports = Db

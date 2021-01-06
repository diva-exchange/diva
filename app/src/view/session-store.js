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

import crypto from 'crypto'
import fs from 'fs-extra'
import path from 'path'

module.exports = function (session) {
  const Store = session.Store

  const SESSION_STORE_PATH_DEFAULT = path.join(__dirname, '../../data/session/')
  const ERROR_SESSION_STORE_PATH_INVALID = 'invalid path'

  class SessionStore extends Store {
    /**
     * @return {string}
     */
    static getPathDefault () {
      return SESSION_STORE_PATH_DEFAULT
    }

    /**
     * @param {string} nameSession
     * @param {string} pathKey
     * @throws {Error} If the session key is not accessible (I/O error)
     * @return {string}
     */
    static getSessionKey (nameSession, pathKey = '') {
      const pathSessionKey = path.join((pathKey || SESSION_STORE_PATH_DEFAULT), '/', nameSession + '.session.key')
      let sessionKey
      try {
        sessionKey = fs.readFileSync(pathSessionKey).toString()
      } catch (error) {
        // buffer length between 16 and 32 bytes
        const _buf = Buffer.alloc(Math.floor(Math.random() * 16 + 16))
        sessionKey = crypto.randomFillSync(_buf).toString()
        fs.outputFileSync(pathSessionKey, sessionKey, { mode: 0o600 })
      }

      return sessionKey
    }

    /**
     * Factory
     *
     * @return {SessionStore}
     */
    static make (options = {}) {
      return new SessionStore(options)
    }

    /**
     * @param {Object} options
     * @private
     */
    constructor (options) {
      options.path = options && options.path ? options.path : SESSION_STORE_PATH_DEFAULT
      try {
        fs.ensureDirSync(options.path, { mode: 0o700 })
      } catch (error) {
        throw new Error(ERROR_SESSION_STORE_PATH_INVALID)
      }

      super(options)
      this.path = options.path
    }

    /**
     * @param {string} sid
     * @param {Object} session
     * @param {Function} callback
     * @public
     */
    set (sid, session, callback) {
      let error = null
      const p = this._getSessionPath(sid)
      try {
        fs.removeSync(p)
        fs.outputFileSync(
          p,
          session ? JSON.stringify(session) : '',
          {
            mode: 0o600,
            flag: 'wx'
          }
        )
      } catch (err) {
        error = err
      }
      callback(error)
    }

    /**
     * @param {string} sid
     * @param {Function} callback
     * @public
     */
    get (sid, callback) {
      fs.readFile(
        this._getSessionPath(sid),
        { flag: 'r' },
        (err, data) => {
          callback(err, data ? JSON.parse(data) : null)
        }
      )
    }

    /**
     * @param {string} sid
     * @param {Function} callback
     * @public
     */
    destroy (sid, callback) {
      let error = null
      try {
        fs.removeSync(this._getSessionPath(sid))
      } catch (err) {
        error = err
      }
      if (typeof callback === 'function') {
        callback(error)
      }
    }

    /**
     * @param {Function} callback
     * @public
     */
    length (callback) {
      fs.readdir(this.path, (err, files) => {
        callback(err, files.filter(path => path.indexOf('.') === -1).length)
      })
    }

    /**
     * @param {Function} callback
     * @public
     */
    clear (callback) {
      let error = null
      try {
        fs.readdirSync(this.path)
          .filter(path => path.indexOf('.') === -1)
          .forEach(p => fs.unlinkSync(path.join(this.path, p)))
      } catch (err) {
        error = err
      }
      callback(error)
    }

    /**
     * @param {string} sid
     * @param {Object} session
     * @param {Function} callback
     * @public
     */
    touch (sid, session, callback) {
      this.set(sid, session, callback)
    }

    /**
     * @param {string} sid
     * @returns {string}
     * @private
     */
    _getSessionPath (sid) {
      return path.join(this.path, crypto.createHash('sha256').update(sid).digest('hex'))
    }
  }

  return SessionStore
}

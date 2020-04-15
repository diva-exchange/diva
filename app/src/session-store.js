/*!
 * Simple file-based Session Store
 * Copyright(c) 2019-2020 Konrad Baechler, https://diva.exchange
 * GPL3 Licensed
 */

'use strict'

import crypto from 'crypto'
import fs from 'fs-extra'
import path from 'path'

module.exports = function (session) {
  const Store = session.Store

  const SESSION_STORE_PATH_DEFAULT = path.join(__dirname, '../data/session/')
  const ERROR_SESSION_STORE_PATH_INVALID = 'invalid path'

  class SessionStore extends Store {
    /**
     * @return {string}
     */
    static getPathDefault () {
      return SESSION_STORE_PATH_DEFAULT
    }

    /**
     * @param nameSession {string}
     * @param pathKey {string}
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
     * @param options {Object}
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
     * @param sid {string}
     * @param session {Object}
     * @param callback {Function}
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
     * @param sid {string}
     * @param callback {Function}
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
     * @param sid {string}
     * @param callback {Function}
     * @public
     */
    destroy (sid, callback) {
      let error = null
      try {
        fs.removeSync(this._getSessionPath(sid))
      } catch (err) {
        error = err
      }
      callback(error)
    }

    /**
     * @param callback {Function}
     * @public
     */
    length (callback) {
      fs.readdir(this.path, (err, files) => {
        callback(err, files.filter(path => path.indexOf('.') === -1).length)
      })
    }

    /**
     * @param callback {Function}
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
     * @param sid {string}
     * @param session {Object}
     * @param callback {Function}
     * @public
     */
    touch (sid, session, callback) {
      this.set(sid, session, callback)
    }

    /**
     * @param sid {string}
     * @returns {string}
     * @private
     */
    _getSessionPath (sid) {
      return path.join(this.path, crypto.createHash('sha256').update(sid).digest('hex'))
    }
  }

  return SessionStore
}

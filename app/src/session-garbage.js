/*!
 * Diva session garbage handler
 * Copyright(c) 2020 Konrad Baechler, https://diva.exchange
 * GPL3 Licensed
 */

'use strict'

import fs from 'fs-extra'
import path from 'path'

import { KeyStore } from '../src/key-store'

const SESSION_GARBAGE_REMOVE_FLAG = '.remove'

export class SessionGarbage {
  /**
   * Factory
   *
   * @param maxAge {number} Maximum age of session, defaults to 60 minutes
   * @param interval {number} Running interval in milliseconds, defaults to 10 seconds
   */
  static collect (maxAge = 60 * 60 * 1000, interval = 10000) {
    setInterval(() => { SessionGarbage._collector(maxAge) }, interval)
  }

  /**
   * Whether or not the garbage collector shall delete session files after they expire
   *
   * @param flag {boolean}
   */
  static doDeleteFiles (flag) {
    const pathRemoveFlagFile = path.join(__dirname, '../data/session/', SESSION_GARBAGE_REMOVE_FLAG)
    flag ? fs.outputFileSync(pathRemoveFlagFile, '') : fs.removeSync(pathRemoveFlagFile)
  }

  /**
   * @param maxAge {number}
   * @private
   */
  static _collector (maxAge) {
    const pathSession = path.join(__dirname, '../data/session/')
    const doRemove = fs.pathExistsSync(path.join(pathSession, SESSION_GARBAGE_REMOVE_FLAG))
    fs.readdir(pathSession, (err, arrayFiles) => {
      if (!err) {
        arrayFiles.filter(nameFile => nameFile.indexOf('.') === -1).forEach((nameFile) => {
          const pathSessionFile = path.join(pathSession, nameFile)
          fs.stat(pathSessionFile, (err, fsStat) => {
            if (!err && Math.floor(fsStat.mtimeMs) < (new Date()).getTime() - maxAge) {
              SessionGarbage._zeroFile(pathSessionFile, doRemove)
            }
          })
        })
      }
    })
  }

  /**
   * Overwrite sensitive data with '0' with the session file
   *
   * @param pathSessionFile {string}
   * @param doRemove {boolean}
   * @private
   */
  static _zeroFile (pathSessionFile, doRemove) {
    fs.readFile(
      pathSessionFile,
      { flag: 'r' },
      (err, data) => {
        if (!err) {
          let session = {}
          try {
            session = JSON.parse(data)
          } catch (error) {
            return
          }
          session.isAuthenticated = false
          KeyStore.make().delete(session.account + ':keyPrivate')
          session.account = Buffer.from(session.account || '').fill('0').toString()
          session.keyPublic = Buffer.from(session.keyPublic || '').fill('0').toString()
          fs.outputFileSync(
            pathSessionFile,
            JSON.stringify(session),
            {
              mode: 0o600,
              flag: 'w'
            }
          )
          if (doRemove) {
            fs.removeSync(pathSessionFile)
          }
        }
      }
    )
  }
}

module.exports = { SessionGarbage }

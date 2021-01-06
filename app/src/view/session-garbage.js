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

import fs from 'fs-extra'
import path from 'path'

import { KeyStore } from '../auth/key-store'

const SESSION_GARBAGE_REMOVE_FLAG = '.remove'

export class SessionGarbage {
  /**
   * Factory
   *
   * @param {number} maxAge - Maximum age of session, defaults to 60 minutes
   * @param {number} interval - Running interval in milliseconds, defaults to 10 seconds
   */
  static collect (maxAge = 60 * 60 * 1000, interval = 10000) {
    setInterval(() => { SessionGarbage._collector(maxAge) }, interval)
  }

  /**
   * Whether or not the garbage collector shall delete session files after they expire
   *
   * @param {boolean} flag
   */
  static doDeleteFiles (flag) {
    const pathRemoveFlagFile = path.join(__dirname, '../../data/session/', SESSION_GARBAGE_REMOVE_FLAG)
    flag ? fs.outputFileSync(pathRemoveFlagFile, '') : fs.removeSync(pathRemoveFlagFile)
  }

  /**
   * @param {number} maxAge
   * @private
   */
  static _collector (maxAge) {
    const pathSession = path.join(__dirname, '../../data/session/')
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
   * @param {string} pathSessionFile
   * @param {boolean} doRemove
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

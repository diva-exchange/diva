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

import { Config } from './src/config/config'
import { Db } from './src/db'
import fs from 'fs'
import get from 'simple-get'
import path from 'path'
import { User } from './src/auth/user'

(async () => {
  try {
    fs.unlinkSync(path.normalize(path.join(__dirname, 'data/diva.sqlite')))
  } catch (error) {}

  Db.create('diva')

  await setAccount(Config.make())
})()

/**
 * @param config {Config}
 * @returns {Promise<any>}
 */
function setAccount (config) {
  return new Promise((resolve, reject) => {
    const url = 'http://' + config.getValueByKey('api') + '/about'
    get.concat(url, (error, _, data) => {
      if (error) {
        reject(error)
      }
      const result = JSON.parse(data)
      config.set('iroha.account', result.creator)
      User.create(result.creator)
      resolve()
    })
  })
}

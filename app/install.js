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
import fs from 'fs-extra'
import get from 'simple-get'
import path from 'path'
import { User } from './src/auth/user'

(async () => {
  try {
    fs.unlinkSync(path.normalize(path.join(__dirname, 'data/diva.sqlite')))
    fs.unlinkSync(path.normalize(path.join(__dirname, 'static/js/vendor/umbrella.min.js')))
  } catch (error) {}

  fs.copyFileSync(path.normalize(path.join(__dirname, '../node_modules/umbrellajs/umbrella.min.js')),
    path.normalize(path.join(__dirname, 'static/vendor/umbrella.min.js')))

  Db.create('diva')
  const config = Config.make()
  process.env.API && config.set('api', process.env.API)
  process.env.API_TOKEN && config.set('api.token', process.env.API_TOKEN)
  process.env.I2P_SCRAPER_URL && config.set('i2p.webconsole.scraper.url', process.env.I2P_SCRAPER_URL)
  process.env.I2P_HTTP_PROXY && config.set('i2p.http.proxy', process.env.I2P_HTTP_PROXY)
  process.env.I2P_SOCKS_PROXY && config.set('i2p.socks.proxy', process.env.I2P_SOCKS_PROXY)

  await setAccount(config)
})()

/**
 * @param {Config} config
 * @returns {Promise<*>}
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

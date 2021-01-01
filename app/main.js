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
import { HttpServer } from './src/http-server'
import { Logger } from '@diva.exchange/diva-logger'
import { SessionGarbage } from './src/view/session-garbage'

(async () => {
  // Load Logger
  const level = process.env.LOG_LEVEL ||
    (process.env.NODE_ENV === 'production' ? /* istanbul ignore next */ 'info' : 'trace')
  Logger.setOptions({ level: level })

  // Load Config, populate Cache
  Config.make()

  // start http/websocket server
  const h = new HttpServer(process.env.PORT || 3911, process.env.BIND_IP || '127.0.0.1')
  process.on('SIGINT', () => {
    h.shutdown().then(() => {
      process.exit(0)
    })
  })

  SessionGarbage.collect()
})()

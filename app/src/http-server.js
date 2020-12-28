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

import http from 'http'
import { Logger } from '@diva.exchange/diva-logger'

import { Routes as DivaRoutes } from './diva/routes'

export class HttpServer {
  /**
   * Factory
   *
   * @param name
   * @param port
   * @param bindIP
   * @returns {HttpServer}
   * @public
   */
  static make (name, port = 3000, bindIP = '0.0.0.0') {
    return new HttpServer(name, port, bindIP)
  }

  /**
   * @param name {string}
   * @param port {number}
   * @param bindIP {string}
   * @throws {Error}
   * @private
   */
  constructor (name, port = 3000, bindIP = '0.0.0.0') {
    this.router = new DivaRoutes(this)

    this._port = HttpServer.normalizePort(process.env.PORT || port)
    this.router.getApp().set('port', this._port)

    this._server = http.createServer(this.router.getApp())
    this._server.on('listening', () => {
      Logger.info(`${name} HttpServer listening on ${bindIP}:${this._port}`)
    })
    this._server.on('close', () => {
      Logger.info(`${name} HttpServer closing on ${bindIP}:${this._port}`)
    })
    this._server.on('error', this.onError.bind(this))

    this._server.listen(this._port, bindIP)
    this.router.init()
  }

  /**
   * @returns {Server}
   */
  getServer () {
    return this._server
  }

  /**
   * Normalize a port into a number, string, or false.
   */
  static normalizePort (val) {
    const port = parseInt(val, 10)

    if (isNaN(port)) {
      // named pipe
      return val
    }

    if (port >= 0) {
      // port number
      return port
    }

    return false
  }

  /**
   * Event listener for HTTP server "error" event.
   */
  onError (error) {
    if (error.syscall !== 'listen') {
      throw error
    }

    const bind = typeof this._port === 'string'
      ? 'Pipe ' + this._port
      : 'Port ' + this._port

    // handle specific listen errors with friendly messages
    switch (error.code) {
      case 'EACCES':
        Logger.error(bind + ' requires elevated privileges')
        break
      case 'EADDRINUSE':
        Logger.error(bind + ' is already in use')
        break
      default:
        throw error
    }

    process.exit(1)
  }
}

module.exports = { HttpServer }

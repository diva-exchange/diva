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

import { Config } from './config'
import http from 'http'
import { Logger } from '@diva.exchange/diva-logger'
import { Routes as DivaRoutes } from './diva/routes'
import WebSocket from 'ws'

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
    this._mapWebSocketSubscription = new Map()
    this._idWebSocket = 0
    this._mapWebSocket = new Map()

    this.router = new DivaRoutes(this)

    this._port = HttpServer.normalizePort(port)
    this.router.getApp().set('port', this._port)

    this._httpServer = http.createServer(this.router.getApp())
    this._httpServer.on('listening', () => {
      Logger.info(`${name} HttpServer listening on ${bindIP}:${this._port}`)
    })
    this._httpServer.on('close', () => {
      Logger.info(`${name} HttpServer closing on ${bindIP}:${this._port}`)
    })
    this._httpServer.on('error', this.onError.bind(this))

    /** @type WebSocket */
    this._websocketApi = new WebSocket('ws://' + Config.make().getValueByKey('api'),
      {
        headers: {
          'diva-auth-token': Config.make().getValueByKey('api.token')
        }
      }
    )
    this._websocketApi.on('open', () => {
      Logger.trace(`${name} WebsocketApi connection established`)
    })
    this._websocketApi.on('message', (data) => {
      Logger.trace('WebsocketApi incoming data').trace(data)
      let obj = {}
      try {
        obj = JSON.parse(data)
      } catch (error) {
        return
      }
      if (this._mapWebSocketSubscription.has(obj.channel || false)) {
        this._mapWebSocketSubscription.get(obj.channel).forEach((id) => {
          this._mapWebSocket.get(id).send(data)
        })
      }
    })
    this._websocketApi.on('error', (error) => {
      Logger.error(`${name} WebsocketApi error`).trace(error)
      this.onError(error)
    })
    this._websocketApi.on('close', (code, reason) => {
      Logger.warn(`${name} WebsocketApi closing ${code} ${reason}`)
    })

    /** @type WebSocket.Server */
    this._websocketServer = new WebSocket.Server({ server: this._httpServer })
    this._websocketServer.on('connection', (ws) => {
      this._idWebSocket++
      const id = this._idWebSocket
      ws.on('message', async (data) => {
        Logger.trace('WebsocketServer incoming data').trace(data)
        this._processWebSocketData(id, data)
      })
      ws.on('close', (code, reason) => {
        Logger.info(`${name} Websocket closed ${code}, ${reason}`)
        this._mapWebSocketSubscription.forEach((arrayId, channel) => {
          const k = arrayId.indexOf(id)
          if (k > -1) {
            arrayId.splice(k, 1)
            this._mapWebSocketSubscription.set(channel, arrayId)
          }
        })
        this._mapWebSocket.delete(id)
      })
      this._mapWebSocket.set(id, ws)
    })
    this._websocketServer.on('error', (error) => {
      Logger.error(`${name} WebsocketServer error`).trace(error)
      this.onError(error)
    })
    this._websocketServer.on('listening', () => {
      const wsa = this._websocketServer.address()
      Logger.info(`${name} WebsocketServer listening on ${wsa.address}:${wsa.port}`)
    })
    this._websocketServer.on('close', () => {
      Logger.info(`${name} WebsocketServer closed`)
    })

    this._httpServer.listen(this._port, bindIP)
    this.router.init()
  }

  /**
   * @returns {Promise<void>}
   */
  shutdown () {
    return new Promise((resolve) => {
      this._websocketApi.close(1001, 'Bye')
      this._websocketServer.close(() => {
        this._httpServer.close(() => {
          resolve()
        })
      })
    })
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

  /**
   * @param id {number}
   * @param json {string} JSON data
   * @private
   */
  _processWebSocketData (id, json) {
    let obj = {}
    try {
      obj = JSON.parse(json)
    } catch (error) {
      Logger.trace(`JSON parse error: ${error}`)
      return
    }
    switch (obj.command || '') {
      case '':
        break
      case 'subscribe':
        if (obj.channel) {
          if (!this._mapWebSocketSubscription.has(obj.channel)) {
            this._mapWebSocketSubscription.set(obj.channel, [id])
          } else if (this._mapWebSocketSubscription.get(obj.channel).indexOf(id) === -1) {
            this._mapWebSocketSubscription.get(obj.channel).push(id)
          }
        }
        break
      case 'unsubscribe':
        if (obj.channel) {
          if (this._mapWebSocketSubscription.has(obj.channel)) {
            const arrayId = this._mapWebSocketSubscription.get(obj.channel)
            const k = arrayId.indexOf(id)
            if (k > -1) {
              arrayId.splice(k, 1)
              this._mapWebSocketSubscription.set(obj.channel, arrayId)
            }
          }
        }
        break
      default:
        this._websocketApi.send(json)
    }
  }
}

module.exports = { HttpServer }

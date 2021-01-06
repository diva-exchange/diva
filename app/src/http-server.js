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

import { Config } from './config/config'
import http from 'http'
import { Logger } from '@diva.exchange/diva-logger'
import { Routes as DivaRoutes } from './routes'
import WebSocket from 'ws'

export class HttpServer {
  /**
   * @param port {number}
   * @param bindIP {string}
   * @throws {Error}
   * @public
   */
  constructor (port = 3000, bindIP = '0.0.0.0') {
    this._mapWebSocketSubscription = new Map()
    this._idWebSocket = 0
    this._mapWebSocket = new Map()
    this._mapFilterWebsocketLocal = new Map()
    this._mapFilterWebsocketApi = new Map()

    this.router = new DivaRoutes(this)

    this._ip = bindIP
    this._port = HttpServer.normalizePort(port)
    this.router.getApp().set('port', this._port)

    this._httpServer = http.createServer(this.router.getApp())
    this._httpServer.on('listening', () => {
      Logger.info(`HttpServer listening on ${this._ip}:${this._port}`)
    })
    this._httpServer.on('close', () => {
      Logger.info(`HttpServer closed on ${this._ip}:${this._port}`)
    })
    this._httpServer.on('error', this._onError.bind(this))

    this._attachWebSocketApi()
    this._attachWebSocketServer()

    this._httpServer.listen(this._port, this._ip)
    this.router.init()
  }

  /**
   * @private
   */
  _attachWebSocketApi () {
    /** @type WebSocket */
    this._websocketApi = new WebSocket('ws://' + Config.make().getValueByKey('api'),
      {
        headers: {
          'diva-auth-token': Config.make().getValueByKey('api.token')
        }
      }
    )

    this._websocketApi.on('open', () => {
      Logger.info(`WebsocketApi connection established to ${Config.make().getValueByKey('api')}`)
    })

    this._websocketApi.on('message', (json) => {
      let obj = {}
      try {
        obj = JSON.parse(json)
      } catch (error) {
        return
      }
      if (this._mapWebSocketSubscription.has(obj.channel || false)) {
        let callback = this._mapFilterWebsocketApi.get(obj.channel + ':' + obj.command)
        callback = callback || this._mapFilterWebsocketApi.get(obj.channel)
        try {
          obj = typeof callback === 'function' ? callback(obj) : obj
          obj && this._mapWebSocketSubscription.get(obj.channel).forEach((id) => {
            this._mapWebSocket.get(id).send(JSON.stringify(obj))
          })
        } catch (error) {
          Logger.error('WebsocketApi filter error').trace(error)
        }
      }
    })

    this._websocketApi.on('error', (error) => {
      Logger.error('WebsocketApi error').trace(error)
      this._onError(error)
    })

    this._websocketApi.on('close', (code, reason) => {
      const msg = reason ? `${code} - ${reason}` : code
      Logger.warn(`WebsocketApi closed: ${msg}`)
    })
  }

  /**
   * @private
   */
  _attachWebSocketServer () {
    /** @type WebSocket.Server */
    this._websocketServer = new WebSocket.Server({ server: this._httpServer })
    this._websocketServer.on('connection', (ws) => {
      this._idWebSocket++
      const id = this._idWebSocket

      ws.on('message', (data) => {
        this._processWebSocketLocal(id, data)
      })

      ws.on('close', (code, reason) => {
        const msg = reason ? `${code} - ${reason}` : code
        Logger.info(`Websocket closed: ${msg}`)

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
      Logger.error('WebsocketServer error').trace(error)
      this._onError(error)
    })

    this._websocketServer.on('listening', () => {
      Logger.info(`WebsocketServer listening on ${this._ip}:${this._port}`)
    })

    this._websocketServer.on('close', () => {
      Logger.info(`WebsocketServer closed on ${this._ip}:${this._port}`)
    })
  }

  /**
   * @return {Promise<void>}
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
   * @param ident {string}
   * @param callback {function}
   */
  setFilterWebsocketLocal (ident, callback) {
    this._mapFilterWebsocketLocal.set(ident, callback)
  }

  /**
   * @param ident {string}
   * @param callback {function}
   */
  setFilterWebsocketApi (ident, callback) {
    this._mapFilterWebsocketApi.set(ident, callback)
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
   * Incoming data from local client
   *
   * @param id {number}
   * @param json {string} JSON data
   * @private
   */
  _processWebSocketLocal (id, json) {
    let obj = {}
    try {
      obj = JSON.parse(json)
    } catch (error) {
      Logger.trace(`JSON parse error: ${error}`)
      return
    }

    if (!obj.command || !obj.channel) {
      return
    }

    let callback = this._mapFilterWebsocketLocal.get(obj.channel + ':' + obj.command)
    callback = callback || this._mapFilterWebsocketLocal.get(obj.channel)

    switch (obj.command) {
      case 'subscribe':
        if (!this._mapWebSocketSubscription.has(obj.channel)) {
          this._mapWebSocketSubscription.set(obj.channel, [id])
        } else if (this._mapWebSocketSubscription.get(obj.channel).indexOf(id) === -1) {
          this._mapWebSocketSubscription.get(obj.channel).push(id)
        }
        break
      case 'unsubscribe':
        if (this._mapWebSocketSubscription.has(obj.channel)) {
          const arrayId = this._mapWebSocketSubscription.get(obj.channel)
          const k = arrayId.indexOf(id)
          if (k > -1) {
            arrayId.splice(k, 1)
            this._mapWebSocketSubscription.set(obj.channel, arrayId)
          }
        }
        break
      default:
        try {
          obj = typeof callback === 'function' ? callback(obj, this._mapWebSocket.get(id)) : obj
          obj && this._websocketApi.send(JSON.stringify(obj))
        } catch (error) {
          obj.error = error.toString()
          this._mapWebSocket.get(id).send(JSON.stringify(obj))
        }
    }
  }

  /**
   * Event listener for HTTP server "error" event.
   * @private
   */
  _onError (error) {
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

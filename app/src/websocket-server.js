/*!
 * WebSocket Server
 * Copyright(c) 2020 Konrad Baechler, https://diva.exchange
 * GPL3 Licensed
 */

'use strict'

import WebSocket from 'ws'
import { Logger } from '@diva.exchange/diva-logger'

export class WebsocketServer {
  /**
   * Factory
   *
   * @param httpServer {HttpServer}
   * @returns {WebsocketServer}
   * @public
   */
  static make (httpServer) {
    return new WebsocketServer(httpServer)
  }

  /**
   * @param httpServer {HttpServer}
   * @private
   */
  constructor (httpServer) {
    const server = new WebSocket.Server({ server: httpServer.getServer() })
    this._id = 0

    server.on('error', (error) => {
      Logger.error('WebsocketServer.constructor()').error(error)
    })
    server.on('listening', () => {
      Logger.info('WebsocketServer.constructor(): listening').info(server.address())
    })
    server.on('connection', (ws) => {
      this._id++

      const id = this._id

      ws.isAlive = true
      ws.on('pong', () => {
        ws.isAlive = true
      })

      ws.on('message', (message) => {
        if (typeof this._onMessage === 'function') {
          this._onMessage(id, ws, message)
        }
      })

      ws.on('close', (code, reason) => {
        if (typeof this._onClose === 'function') {
          this._onClose(id, ws, reason, code)
        }
      })

      // ping
      this._pingServerClient(ws)
    })

    return this
  }

  /**
   * @param onMessage {Function}
   */
  onMessage (onMessage = (message) => message) {
    if (typeof onMessage === 'function') {
      this._onMessage = onMessage
    }
  }

  /**
   * @param onClose {Function}
   */
  onClose (onClose = (code, reason) => [code, reason]) {
    if (typeof onClose === 'function') {
      this._onClose = onClose
    }
  }

  /**
   * @param ws
   * @private
   */
  _pingServerClient (ws) {
    if (ws.isAlive === false) {
      ws.terminate()
      return
    }

    ws.isAlive = false
    ws.ping()
    setTimeout(() => { this._pingServerClient(ws) }, 30000)
  }
}

module.exports = { WebsocketServer }

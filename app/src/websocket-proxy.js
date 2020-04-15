/*!
 * WebSocket Proxy
 * Copyright(c) 2020 Konrad Baechler, https://diva.exchange
 * GPL3 Licensed
 */

'use strict'

import { Logger } from 'diva-logger'
import WebSocket from 'ws'

import { Network } from './network'

const WEBSOCKET_CLIENT_SEND_OPTIONS = { compress: true, binary: false, mask: true, fin: true }
const WEBSOCKET_SERVER_SEND_OPTIONS = { compress: true, binary: false, mask: false, fin: true }

const POOL_SIZE = 10

export class WebsocketProxy {
  /**
   * Proxy for WebSockets
   * Relay websocket traffic from local endpoint to i2p network and vice versa
   *
   * @param httpServer {HttpServer}
   * @returns {WebsocketProxy}
   * @public
   */
  static make (httpServer) {
    return new WebsocketProxy(httpServer)
  }

  /**
   * @param httpServer {HttpServer}
   * @private
   */
  constructor (httpServer) {
    this._id = -1
    this._sockets = []
    this._ws = []
    this._countSocketError = 0

    this._server = new WebSocket.Server({ server: httpServer.getServer() })
    this._server.on('connection', (ws) => {
      this._connectServerClient(ws)
    })
    this._server.on('error', (error) => {
      Logger.error('ProxyWebSocket Server').error(error)
    })
    this._server.on('listening', () => {
      Logger.info('WebsocketProxy.constructor(): listening').info(this._server.address())
    })

    this._createClient()
  }

  /**
   * @param ws
   * @private
   */
  _connectServerClient (ws) {
    const _id = parseInt(Object.keys(this._sockets).filter(id => { return !this._ws[id] }).shift())

    if (!this._sockets[_id]) {
      this._createClient()
      setTimeout(() => { this._connectServerClient(ws) }, 500)
      return
    }

    ws.isAlive = true
    ws.on('pong', () => {
      ws.isAlive = true
    })

    ws.on('close', () => {
      if (this._sockets[_id]) {
        this._sockets[_id].close(1000, '')
      }
      delete this._sockets[_id]
      delete this._ws[_id]
      this._createClient()
    })

    ws.on('message', (message) => {
      if (this._sockets[_id]) {
        this._sockets[_id].send(message, WEBSOCKET_CLIENT_SEND_OPTIONS)
      }
    })

    this._ws[_id] = ws
    this._pingServerClient(ws)
  }

  /**
   * @private
   */
  _createClient () {
    if (this._sockets.filter(v => v).length >= POOL_SIZE) {
      return
    }

    this._id++
    const _id = this._id
    const socket = Network.make().getWebsocket()

    socket.on('open', () => {
      Logger.trace(`WebsocketProxy._createClient(): ${_id} connected`)
      this._sockets[_id] = socket
      this._countSocketError = 0
      setTimeout(() => { this._createClient() }, 1000)
    })
    socket.on('error', (error) => {
      Logger.error(`WebsocketProxy._createClient(): ${_id}`).error(error)
      this._countSocketError === 10 || this._countSocketError++
    })
    socket.on('ping', () => {
      if (this._sockets[_id]) {
        this._sockets[_id].pong()
      }
    })
    socket.on('message', (data) => {
      if (this._ws[_id]) {
        this._ws[_id].send(data, WEBSOCKET_SERVER_SEND_OPTIONS)
      }
    })
    socket.on('close', () => {
      Logger.trace(`WebsocketProxy._createClient(): ${_id} closing...`)
      if (this._ws[_id]) {
        this._ws[_id].close(1000, '')
      }
      delete this._ws[_id]
      delete this._sockets[_id]
      setTimeout(() => { this._createClient() }, (Math.pow(this._countSocketError, 2) * 1000) + 1)
    })
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

module.exports = { WebsocketProxy }

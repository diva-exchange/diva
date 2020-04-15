/*!
 * HTTPServer
 * Copyright(c) 2019-2020 Konrad Baechler, https://diva.exchange
 * GPL3 Licensed
 */

'use strict'

import http from 'http'
import { Logger } from 'diva-logger'

import { Routes as ApiRoutes } from './api/routes'
import { Routes as DivaRoutes } from './diva/routes'
import { Routes as ProfileRoutes } from './profile/routes'

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
    switch (name) {
      case 'api':
        this.router = new ApiRoutes(this)
        break
      case 'diva':
        this.router = new DivaRoutes(this)
        break
      case 'profile':
        this.router = new ProfileRoutes()
        break
      default:
        throw new Error('Unknown Application')
    }

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

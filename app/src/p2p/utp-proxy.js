/*!
 * utp-proxy
 * Copyright(c) 2019 Konrad Baechler, https://diva.exchange
 * GPL3 Licensed
 */

'use strict'

import { Logger } from '@diva.exchange/diva-logger'

import dgram from 'dgram'
import net from 'net'
import request from 'request-promise-native'
import Node from 'utp-punch'

import { Config } from '../config'
import { shuffleArray } from '../utils'

const BIND_IP_BACKEND = process.env.BACKEND_BIND_IP || '127.0.0.1'
const PORT_BACKEND = process.env.BACKEND_PORT || 10001

const BIND_IP_UTP = process.env.UTP_BIND_IP || '127.0.0.1'

const MESSAGE_PING = 'pi'
const MESSAGE_PONG = 'po'

const MESSAGE_REGISTER = 'R'
const MESSAGE_IDENTITY = 'I'
const MESSAGE_STATUS = 'S'
const MESSAGE_PUNCH_CLIENT = 'PC'
const MESSAGE_PUNCH_SERVER = 'PS'

const REFRESH_PEER_LIST_MS = 60000
const PUNCH_ATTEMPTS = 20
const UTP_OPTIONS = {}
/*
const UTP_OPTIONS = {
  bufferSize: 64, // default 64
  mtu: 1000, // default 1000
  timeout: 5000, // default 5000
  resend: 100, // default 100
  keepAlive: 1000 // default 1000
}
*/

export class UtpProxy {
  /**
   * Factory
   *
   * @return {UtpProxy}
   * @public
   */
  static make () {
    return new UtpProxy()
  }

  /**
   * Constructor
   *
   * @private
   */
  constructor () {
    // connect to the tracker and load the peer list
    // tracker should be i2p addresses
    // do the UDP hole punching

    this._config = Config.make()

    this._loadPeers()
  }

  /**
   * Shutdown proxy server
   * @public
   */
  shutdown () {
    this._udpSocketHangout.close()

    // @FIXME walk through all nodes and close 'em

    this._backendRequest.close()
  }

  /**
   * Load peer list from bootstrap url
   *
   * @param force {boolean} Force to load fresh peer list
   * @throws {Error}
   * @private
   */
  _loadPeers (force = false) {
    if (force || typeof this._arrayBootstrapUrl === 'undefined') {
      this._arrayBootstrapUrl = shuffleArray(this._config.getValueByKey('hangout.bootstrap.url'))
    }

    const url = this._arrayBootstrapUrl.pop()
    if (typeof url === 'undefined') {
      throw new Error('Failed to bootstrap')
    }

    Logger.trace('Bootstrap URL: ' + url)

    request.get({
      url: url,
      json: true
    }).then((json) => {
      if (typeof json.hangouts === 'undefined' || typeof json.peers === 'undefined') {
        throw new Error('invalid response: ' + JSON.stringify(json))
      }

      this.identPeer = ''
      this._utpPeers = {}
      this._addressHangouts = {}
      this._hangouts = json.hangouts
      this._peers = json.peers
      this._refreshPeerListMS = REFRESH_PEER_LIST_MS

      Object.keys(this._hangouts).forEach((name) => {
        this._addressHangouts[this._hangouts[name].address] = this._hangouts[name].port
      })

      this._onReady()
    }).catch((error) => {
      Logger.trace(error)
      Logger.error(`${error.message}`)
      this._loadPeers()
    })
  }

  /**
   * @param node {Node}
   * @param type {string}
   * @param oRequest {Object}
   * @param rinfo {Object} Hangout
   * @private
   */
  _punch (node, type, oRequest, rinfo) {
    // request a punch from the other side, via hangout
    node.getUdpSocket().send(JSON.stringify({
      type: type,
      identPeer: oRequest.identPeer
    }), rinfo.port, rinfo.address)

    node.punch(PUNCH_ATTEMPTS, oRequest.port, oRequest.address, (isOK) => {
      if (isOK) {
        node.on('timeout', () => {
          Logger.warn('connect timeout')
          delete this._utpPeers[oRequest.identPeer]
        })
      } else {
        delete this._utpPeers[oRequest.identPeer]
      }
    })
  }

  /**
   * @private
   */
  _onReady () {
    this._udpSocketHangout = dgram.createSocket('udp4')
      .on('error', (error) => {
        throw new Error(error)
      })
      .on('listening', () => {
        this._udpSocketHangout.on('message', (msg, rinfo) => {
          this._onMessageFromHangout(msg, rinfo)
        })
        this._registerAtHangout()
      })

    this._udpSocketHangout.bind(0, BIND_IP_UTP)

    this._idRequest = 0
    this._requests = {}
    this._binaryData = {}
    this._backendRequest = net.createServer((backendSocket) => {
      this._backendIP = backendSocket.remoteAddress
      this._onConnection(backendSocket)
    }).on('error', (error) => {
      throw new Error(error)
    })

    this._backendRequest.listen(PORT_BACKEND, BIND_IP_BACKEND, () => {
      Logger.info('backend listening for requests on ' + BIND_IP_BACKEND + ':' + PORT_BACKEND)
    })
  }

  /**
   * @private
   */
  _registerAtHangout () {
    shuffleArray(Object.keys(this._hangouts)).forEach((nameHangout) => {
      shuffleArray(Object.keys(this._peers)).forEach((identPeer) => {
        if (typeof this._utpPeers[identPeer] === 'undefined') {
          this._udpSocketHangout.send(JSON.stringify({
            type: MESSAGE_REGISTER,
            identPeer: identPeer
          }), this._hangouts[nameHangout].port, this._hangouts[nameHangout].address)
        }
      })
    })

    setTimeout(() => { this._registerAtHangout() }, this._refreshPeerListMS)
  }

  /**
   * @param msg {Buffer}
   * @param rinfo {Object} Hangout
   * @private
   */
  _onMessageFromHangout (msg, rinfo) {
    const message = msg.toString().trim()

    if (message === MESSAGE_PING) {
      this._udpSocketHangout.send(MESSAGE_PONG, rinfo.port, rinfo.address)
      return
    }

    let oRequest
    try {
      oRequest = JSON.parse(message)
    } catch (error) {
      Logger.error(`failed to parse: ${message}`)
      Logger.error(error)
      return
    }

    switch (oRequest.type || '') {
      case MESSAGE_IDENTITY:
        this.identPeer = oRequest.identPeer
        break
      case MESSAGE_STATUS:
        this._requestStatus(oRequest, rinfo)
        break
      case MESSAGE_PUNCH_CLIENT:
      case MESSAGE_PUNCH_SERVER:
        this._requestPunch(oRequest, rinfo)
        break
      default:
        Logger.warn('invalid request')
        Logger.trace(oRequest)
        break
    }
  }

  /**
   *
   * @param oRequest {Object}
   * @param rinfo Hangout
   * @private
   */
  _requestStatus (oRequest, rinfo) {
    const onlinePeers = Object.keys(oRequest.online).filter((_identPeer) => {
      return typeof this._utpPeers[_identPeer] === 'undefined'
      // return this.identPeer && this.identPeer !== _identPeer && typeof this._utpPeers[_identPeer] === 'undefined'
    })

    onlinePeers.forEach((_identPeer) => {
      this._utpPeers[_identPeer] = {
        nodeClient: new Node(UTP_OPTIONS),
        isClientPunching: false,
        utpClientSocket: null,

        nodeServer: new Node(UTP_OPTIONS, (utpSocket) => {
          this._onConnectionUtpServer(utpSocket)
        }),
        isServerPunching: false
      }

      const nodeServer = this._utpPeers[_identPeer].nodeServer
      const nodeClient = this._utpPeers[_identPeer].nodeClient

      nodeClient.bind(0, BIND_IP_UTP, () => {
        nodeClient.getUdpSocket().send(JSON.stringify({
          type: MESSAGE_PUNCH_CLIENT,
          identPeer: _identPeer
        }), rinfo.port, rinfo.address)
      })

      nodeServer.bind(0, BIND_IP_UTP, () => {
        nodeServer.listen(() => {
          nodeServer.getUdpSocket().send(JSON.stringify({
            type: MESSAGE_PUNCH_SERVER,
            identPeer: _identPeer
          }), rinfo.port, rinfo.address)
        })
      })
    })
  }

  /**
   *
   * @param oRequest {Object}
   * @param rinfo {Object} Hangout
   * @private
   */
  _requestPunch (oRequest, rinfo) {
    if (typeof this._utpPeers[oRequest.identPeer] === 'undefined') {
      Logger.warn(`undefined requested peer: ${oRequest.identPeer}`)
      return
    }
    // other side
    const utpPeer = this._utpPeers[oRequest.identPeer]

    switch (oRequest.type) {
      case MESSAGE_PUNCH_CLIENT:
        if (utpPeer.isServerPunching) {
          return
        }
        utpPeer.isServerPunching = true
        this._punch(utpPeer.nodeServer, MESSAGE_PUNCH_SERVER, oRequest, rinfo)
        break
      case MESSAGE_PUNCH_SERVER:
        if (utpPeer.isClientPunching) {
          return
        }
        utpPeer.isClientPunching = true
        this._punch(utpPeer.nodeClient, MESSAGE_PUNCH_CLIENT, oRequest, rinfo)
        utpPeer.nodeClient.connect(oRequest.port, oRequest.address, (utpSocket) => {
          this._utpPeers[oRequest.identPeer].utpClientSocket = utpSocket
          this._onConnectionUtpClient(utpSocket)
        })
        break
    }
  }

  /**
   * @param utpSocket {module:net.Socket}
   * @private
   */
  _onConnectionUtpServer (utpSocket) {
    Logger.trace('uTP server got incoming connection:')
    Logger.trace(utpSocket.address())

    let data = []

    utpSocket.on('data', (chunk) => {
      data.push(chunk)
      let json
      try {
        json = JSON.parse(Buffer.concat(data).toString('binary'))
        data = []
      } catch (error) {
        return
      }

      this._connectBackend(json, utpSocket)
    })

    utpSocket.on('end', () => {
      Logger.warn('uTP server, connection closed')
    })
  }

  /**
   * @param json {Object}
   * @param utpSocket {module:net.Socket}
   * @private
   */
  _connectBackend (json, utpSocket) {
    const data = []
    const backendClient = net.createConnection(PORT_BACKEND, this._backendIP)
      .on('error', (error) => {
        Logger.error(error)
        setTimeout(() => { this._connectBackend(json, utpSocket) }, 500)
      })
      .on('connect', () => {
        backendClient.write(Buffer.from(json.data, 'base64'))
      })
      .on('data', (chunk) => {
        // got response from backend
        data.push(chunk)
      })
      .on('end', () => {
        // forwarding data
        utpSocket.write(JSON.stringify({
          id: json.id,
          data: Buffer.concat(data).toString('base64')
        }))
        backendClient.destroy()
      })
  }

  /**
   * @param utpSocket {module:net.Socket}
   * @private
   */
  _onConnectionUtpClient (utpSocket) {
    Logger.trace('uTP client is connected to:')
    Logger.trace(utpSocket.address())

    let data = []

    utpSocket.on('data', (chunk) => {
      data.push(chunk)
      let json

      try {
        json = JSON.parse(Buffer.concat(data).toString('binary'))
        data = []
      } catch (error) {
        return
      }

      if (typeof this._requests[json.id] !== 'undefined') {
        this._requests[json.id].socketBackend.end(Buffer.from(json.data, 'base64'))
      }
    })

    utpSocket.on('end', () => {
      Logger.warn('uTP client, connection closed')
    })
  }

  /**
   * Stream data from backend to uTP
   *
   * @param socketBackend {module:net.Socket}
   * @private
   */
  _onConnection (socketBackend) {
    this._idRequest++

    const idRequest = this._idRequest

    this._requests[idRequest] = {}
    this._requests[idRequest].socketBackend = socketBackend
    this._binaryData[idRequest] = []

    // incoming data from backend
    this._requests[idRequest].socketBackend.on('data', (chunk) => {
      this._binaryData[idRequest].push(chunk)

      if (typeof this._requests[idRequest].utpPeer !== 'undefined') {
        this._sendRequestUdp(idRequest)
      } else {
        const regex = /:authority.(.+?\.diva\.local)/
        const match = regex.exec(Buffer.concat(this._binaryData[idRequest]).toString('binary'))
        if (match && match.length > 0 && match[1]) {
          if (typeof this._utpPeers[match[1]] !== 'undefined') {
            this._requests[idRequest].identPeer = match[1]
            this._requests[idRequest].utpPeer = this._utpPeers[match[1]]
            this._sendRequestUdp(idRequest)
          } else {
            Logger.error(`ERROR: utpPeer not found ${match[1]}`)
          }
        }
      }
    })

    this._requests[idRequest].socketBackend.on('end', () => {
      if (this._binaryData[idRequest].length > 0 && typeof this._requests[idRequest].utpPeer !== 'undefined') {
        // flush
        Logger.trace(`flushing ${idRequest}`)
        this._sendRequestUdp(idRequest)
      }
      this._requests[idRequest].socketBackend.destroy()
      delete this._requests[idRequest]
      delete this._binaryData[idRequest]

      Logger.trace(`Closed Client backend ${idRequest}`)
    })
  }

  /**
   * Send a request from Backend Server to uTP client
   *
   * @param idRequest {number}
   * @private
   */
  _sendRequestUdp (idRequest) {
    const json = JSON.stringify({
      id: idRequest,
      data: Buffer.concat(this._binaryData[idRequest]).toString('base64')
    })

    this._requests[idRequest].utpPeer.utpClientSocket.write(json)
    this._binaryData[idRequest] = []
  }
}

module.exports = { Http2UtpProxy: UtpProxy }

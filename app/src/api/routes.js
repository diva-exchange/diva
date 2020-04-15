/*!
 * API Router
 * Copyright(c) 2019 Konrad Baechler, https://diva.exchange
 * GPL3 Licensed
 */

'use strict'

import { Api } from './api'
import { Auctioneer } from './auctioneer'
import { Network } from '../network'
import { Router } from '../router'

export class Routes extends Router {
  /**
   * @param httpServer {HttpServer}
   * @public
   */
  constructor (httpServer) {
    const controllerApi = Api.make(httpServer)
    super({
      get: {
        '/*': controllerApi
      },
      post: {
        '/*': controllerApi
      }
    })

    this.controllerApi = controllerApi
  }

  /**
   * @returns {Routes}
   */
  init () {
    this.controllerApi.attachWebsocket()
    Network.make().waitFor().then(() => {
      // Auctioneer.make()
    })
    return this
  }
}

module.exports = { Routes }

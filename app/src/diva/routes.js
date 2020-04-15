/*!
 * Diva Router
 * Copyright(c) 2019-2020 Konrad Baechler, https://diva.exchange
 * GPL3 Licensed
 */

'use strict'

import { Network } from '../network'
import { Router } from '../router'
import { Updater } from './trade/updater'
import { WebsocketProxy } from '../websocket-proxy'

import { UXAuth } from './uxAuth'
import { UXCulture } from './uxCulture'
import { UXMain } from './uxMain'
import { UXTrade } from './trade/uxTrade'
import { UXNetwork } from './network/uxNetwork'
import { UXSocial } from './social/uxSocial'
import { UXAbout } from './about/uxAbout'
import { UXConfig } from './config/uxConfig'

export class Routes extends Router {
  /**
   * @param httpServer {HttpServer}
   * @public
   */
  constructor (httpServer) {
    const controllerUXAuth = UXAuth.make(httpServer)
    const controllerUXCulture = UXCulture.make(httpServer)

    const controllerUXMain = UXMain.make(httpServer)
    const controllerUXTrade = UXTrade.make(httpServer)
    const controllerUXSocial = UXSocial.make(httpServer)
    const controllerUXNetwork = UXNetwork.make(httpServer)
    const controllerUXConfig = UXConfig.make(httpServer)
    const controllerUXAbout = UXAbout.make(httpServer)

    super({
      hasStaticContent: true,
      hasViews: true,
      session: {
        name: 'diva'
      },
      storePathView: ['/', '/trade', '/social', '/network', '/about', '/config'],
      get: {
        '/auth': controllerUXAuth,
        '/newuser': controllerUXAuth,
        '/logout': controllerUXAuth,

        '/': controllerUXMain,
        '/trade': controllerUXTrade,
        '/social': controllerUXSocial,
        '/network(/*)?': controllerUXNetwork,
        '/about': controllerUXAbout,
        '/config(/*)?': controllerUXConfig
      },
      post: {
        '/translate': controllerUXCulture,

        '/login': controllerUXAuth,
        '/register': controllerUXAuth,

        '/trade/*': controllerUXTrade
      }
    })

    this.httpServer = httpServer
  }

  /**
   * @returns {Router}
   */
  init () {
    Network.make().waitFor().then(() => {
      WebsocketProxy.make(this.httpServer)
      Updater.make()
    })

    return this
  }
}

module.exports = { Routes }

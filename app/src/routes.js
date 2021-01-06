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

import { Network } from './network'
import { Router } from './router'

import { UXAuth } from './view/auth/uxAuth'
import { UXCulture } from './view/uxCulture'

import { UXDashboard } from './view/dashboard/uxDashboard'
import { UXTrade } from './view/trade/uxTrade'
import { UXNetwork } from './view/network/uxNetwork'
import { UXSocial } from './view/social/uxSocial'
import { UXAbout } from './view/about/uxAbout'
import { UXConfig } from './view/config/uxConfig'

export class Routes extends Router {
  /**
   * @param {HttpServer} httpServer
   * @public
   */
  constructor (httpServer) {
    const controllerUXAuth = UXAuth.make(httpServer)
    const controllerUXCulture = UXCulture.make(httpServer)

    const controllerUXDashboard = UXDashboard.make(httpServer)
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

        '/': controllerUXDashboard,
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
        '/social/*': controllerUXSocial,
        '/trade/*': controllerUXTrade
      }
    })
  }

  /**
   * @return {Router}
   */
  init () {
    Network.make()
    return this
  }
}

module.exports = { Routes }

/*!
 * Profile Router
 * Copyright(c) 2019 Konrad Baechler, https://diva.exchange
 * GPL3 Licensed
 */

'use strict'

import { Router } from '../router'
import { Main } from './main'

export class Routes extends Router {
  constructor () {
    super({
      get: {
        '/': Main.make
      }
    })
  }
}

module.exports = Routes

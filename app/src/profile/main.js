/*!
 * Profile Main
 * Copyright(c) 2019 Konrad Baechler, https://diva.exchange
 * GPL3 Licensed
 */

'use strict'

import util from 'util'

export class Main {
  static make (req, res) {
    res.render('profile/main', {
      title: 'Profile',
      hostname: req.hostname,
      req: util.inspect(req, { sorted: true, compact: false, getters: true }),
      res: util.inspect(res, { sorted: true, compact: false, getters: true })
    })
  }
}

module.exports = Main

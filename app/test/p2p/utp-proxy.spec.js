/*!
 * UtpProxy Test suite
 * Copyright(c) 2019 Konrad Baechler, https://diva.exchange
 * GPL3 Licensed
 */

'use strict'

import { assert } from 'chai'
import { describe, it } from 'mocha'
import { UtpProxy } from '../../src/p2p/utp-proxy'

/**
 * Project: diva
 * Context: p2p/utp-proxy
 */
describe('//diva// /p2p/utp-proxy', function () {
  describe('Instantiation', function () {
    it('make', function () {
      const p = UtpProxy.make()
      setTimeout(() => {
        assert.isObject(p)
        p.shutdown()
      }, 2000)
    })
  })
})

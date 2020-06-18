/*!
 * Diva Environment Test suite
 * Copyright(c) 2020 Konrad Baechler, https://diva.exchange
 * GPL3 Licensed
 */
'use strict'

import { assert } from 'chai'
import { describe, it } from 'mocha'

import { Environment } from '../src/environment'

/**
 * Project: diva
 * Context: Environment
 */
describe('//diva// /Environment', function () {
  describe('hasBlockchain', function () {
    it('whether the blockchain is available on the network', function () {
      Environment.hasBlockchain().then(r => {
        assert.isFalse(r)
      })
    })
  })
})

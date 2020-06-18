/*!
 * Diva Culture Test suite
 * Copyright(c) 2019 Konrad Baechler, https://diva.exchange
 * GPL3 Licensed
 */
'use strict'

import { assert } from 'chai'
import { describe, it } from 'mocha'

import { shuffleArray, hash } from '../src/utils'

/**
 * Project: diva
 * Context: utils
 */
describe('//diva// /utils', function () {
  describe('shuffleArray', function () {
    it('shuffle an array', function () {
      assert.isArray(shuffleArray([1, 2, 3]))
    })
  })

  describe('hash', function () {
    it('hash a string to a 32bit integer', function () {
      assert.strictEqual(hash('test'), 3556498)
      assert.strictEqual(hash(''), 0)
    })
  })
})

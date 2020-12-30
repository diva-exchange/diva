/*!
 * Diva Session-Store Test suite
 * Copyright(c) 2019 Konrad Baechler, https://diva.exchange
 * GPL3 Licensed
 */
'use strict'

import { assert } from 'chai'
import { describe, it } from 'mocha'

import fs from 'fs-extra'
import path from 'path'
import session from 'express-session'

// @TODO ES6 import
const SessionStore = require('../src/view/session-store')(session)

/**
 * Project: diva
 * Context: session-store
 */
describe('//diva// /session-store', function () {
  const pathSession = path.join(__dirname, './data/session/')

  fs.removeSync(pathSession)

  describe('SessionStore', function () {
    const sid = 'test'
    let s = SessionStore.make()
    s = SessionStore.make({
      path: pathSession
    })

    it('Instantiation', function () {
      assert.instanceOf(s, SessionStore)
      assert.exists(SessionStore.getPathDefault())
    })

    it('Key generation', function () {
      const k = SessionStore.getSessionKey('diva-test', pathSession)
      assert.isString(k, 'invalid session key')
      assert.isTrue(fs.existsSync(pathSession + 'diva-test.session.key'), 'session key file not found')
    })

    it('set/touch', function () {
      s.set(sid, null, (error) => {
        assert.notExists(error)
      })

      s.set(sid, { data: 'other-data' }, (error) => {
        assert.notExists(error)
        s.touch(sid, { data: 'data' }, (error) => {
          assert.notExists(error)
        })
      })
    })

    it('get', async function () {
      await s.get(sid, (error, data) => {
        assert.notExists(error)
        assert.strictEqual(data.data, 'data')
      })
    })

    it('length', async function () {
      await s.length((error, length) => {
        assert.notExists(error)
        assert.strictEqual(length, 1)
      })
    })

    it('destroy', async function () {
      await s.destroy(sid, async (err0) => {
        assert.notExists(err0)
        await s.length((err1, length) => {
          assert.notExists(err1)
          assert.strictEqual(length, 0)
        })
      })
    })

    it('clear', async function () {
      await s.set(sid, { data: 'data' }, async (error) => {
        assert.notExists(error)

        await s.clear(async (error) => {
          assert.notExists(error)
          await s.length((err1, length) => {
            assert.notExists(err1)
            assert.strictEqual(length, 0)
          })
        })
      })
    })
  })
})

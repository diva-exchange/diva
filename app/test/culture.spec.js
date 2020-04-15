/*!
 * Diva Culture Test suite
 * Copyright(c) 2019 Konrad Baechler, https://diva.exchange
 * GPL3 Licensed
 */
'use strict'

import { assert } from 'chai'
import { describe, it } from 'mocha'

import { CULTURE_DEFAULT_LANGUAGE_IDENT, Culture } from '../src/culture'

/**
 * Project: diva
 * Context: culture
 */
describe('//diva// /culture', function () {
  describe('Culture', function () {
    // a request stub
    const _request = {
      'Accept-Language': 'de-CH,de;q=0.8,en-US;q=0.5,en;q=0.3',
      method: 'GET',
      body: {
        uiLanguage: 'ko'
      },
      query: {
        uiLanguage: 'zh'
      },
      acceptsLanguages: () => 'de',
      session: {
        uiLanguage: 'es',
        account: 'test',
        stateView: {
          test: {
            uiLanguage: 'ru'
          }
        }
      }
    }

    it('init, should set the uiLanguage property from the request', function () {
      assert.strictEqual(Culture.init(_request).uiLanguage, 'ko')
    })

    it('getListIdentLanguages, should return an array of language_ident', function () {
      assert.isArray(Culture.getListIdentLanguages())
      assert.isTrue(Culture.getListIdentLanguages().indexOf(CULTURE_DEFAULT_LANGUAGE_IDENT) > -1)
    })

    it('should throw an Error(invalid ident)', () => {
      assert.throws(() => { Culture.t(0) }, 'invalid ident')
    })

    it('should throw an Error(invalid identLanguage)', () => {
      assert.throws(() => { Culture.t('en', {}) }, 'invalid identLanguage')
    })

    it('should throw an Error(invalid ident)', () => {
      assert.throws(() => { Culture.translateArray(0) }, 'invalid ident')
    })

    it('should translate multiple strings using system-wide default language', () => {
      const m = new Map()
      m.set('en', 'English')
      m.set('de', 'German')
      assert.deepEqual(Culture.translateArray(['en', 'de']), m)
    })

    it('should translate to "German"', () => {
      assert.strictEqual(Culture.t('de', 'en'), 'German')
    })

    it('should translate to "English", using the system-wide fallback language "en"', () => {
      assert.strictEqual(Culture.t('en', 'invalid'), 'English')
    })

    it('should translate to UNDEFINED', () => {
      assert.strictEqual(Culture.translateString('_invalid_'), undefined)
    })

    it('languageFromRequest, should use session[account].stateView part of the request stub', function () {
      const r = Object.assign({}, _request)
      delete r.body
      delete r.query
      assert.strictEqual(Culture.languageFromRequest(r), 'ru')
    })

    it('languageFromRequest, should use session part of the request stub', function () {
      const r = Object.assign({}, _request)
      delete r.body
      delete r.query
      delete r.session.stateView
      assert.strictEqual(Culture.languageFromRequest(r), 'es')
    })

    it('languageFromRequest, should use POST/body part of the request stub', function () {
      assert.strictEqual(Culture.languageFromRequest(_request), 'ko')
    })

    it('languageFromRequest, should use GET/query part of the request stub', function () {
      const r = Object.assign({}, _request)
      delete r.body
      assert.strictEqual(Culture.languageFromRequest(r), 'zh')
    })

    it('languageFromRequest, should use Accept-Language header of the request stub', function () {
      const r = Object.assign({}, _request)
      delete r.body
      delete r.query
      delete r.session.stateView
      delete r.session.uiLanguage
      assert.strictEqual(Culture.languageFromRequest(r), 'de')
    })

    it('languageFromRequest, should use system wide fallback language ' + CULTURE_DEFAULT_LANGUAGE_IDENT, function () {
      const r = Object.assign({}, _request)
      delete r.body
      delete r.query
      delete r.session
      r.acceptsLanguages = () => ''
      assert.strictEqual(Culture.languageFromRequest(r), CULTURE_DEFAULT_LANGUAGE_IDENT)
    })

    it('should reload data and return Culture', function () {
      assert.deepEqual(Culture.reload(), Culture)
    })
  })
})

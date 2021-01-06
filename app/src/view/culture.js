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

import dateFormat from 'dateformat'

import { Db } from '../db'

export const CULTURE_DEFAULT_LANGUAGE_IDENT = 'en'

export class Culture {
  /**
   * @param {Object} request
   * @return {Culture}
   */
  static init (request) {
    Culture._make()
    Culture.uiLanguage = Culture.languageFromRequest(request)
    return Culture
  }

  /**
   * @param {Object} request
   * @return {string}
   * @public
   */
  static languageFromRequest (request) {
    let uiLanguage = (request.body && request.body.uiLanguage) || (request.query && request.query.uiLanguage) || ''
    if (!uiLanguage && request.session) {
      const session = request.session
      if (session.account && session.stateView && session.stateView[session.account] &&
        session.stateView[session.account].uiLanguage) {
        uiLanguage = session.stateView[session.account].uiLanguage
      } else {
        uiLanguage = session.uiLanguage
      }
    }

    return uiLanguage || request.acceptsLanguages(Culture.getListIdentLanguages()) || CULTURE_DEFAULT_LANGUAGE_IDENT
  }

  /**
   * Get list of available languages
   *
   * @return {Array}
   * @public
   */
  static getListIdentLanguages () {
    Culture._make()
    return Culture._cacheIdentLanguages
  }

  /**
   * Reload the data in the cache from the database
   *
   * @return {Culture}
   */
  static reload () {
    return Culture._make(true)
  }

  /**
   * Translate an ident
   *
   * @param {string} ident - Identifier to translate
   * @param {Array|string} identLanguage - Target languages to translate to
   * @return {string}
   * @throws {Error}
   * @public
   */
  static translateString (ident, identLanguage = []) {
    if (typeof ident !== 'string') {
      throw new Error('invalid ident')
    }
    return Culture._translate([ident], identLanguage).values().next().value
  }

  /**
   * Alias for translateString
   */
  static t (ident, identLanguage) {
    return Culture.translateString(ident, identLanguage)
  }

  /**
   * Translate multiple idents
   *
   * @param {Array} ident - Identifiers to translate
   * @param {Array|string} identLanguage - Target languages to translate to
   * @return {Map}
   * @throws {Error}
   * @public
   */
  static translateArray (ident, identLanguage = []) {
    if (!(ident instanceof Array)) {
      throw new Error('invalid ident')
    }
    return Culture._translate(ident, identLanguage)
  }

  /**
   * @param {number} timestamp
   * @param {string} format
   * @return {string}
   */
  static formatDateTime (timestamp, format = '') {
    if (format !== '') {
      return dateFormat(timestamp, format)
    }
    switch (Culture.uiLanguage || CULTURE_DEFAULT_LANGUAGE_IDENT) {
      case 'de':
        return dateFormat(timestamp, 'dd.mm.yyyy HH:MM:ss.l o')
      case 'en':
      default:
        return dateFormat(timestamp, 'mm/dd/yyyy hh:MM:ss.l TT o')
    }
  }

  /**
   * @param {Array} ident - Identifiers to translate
   * @param {Array|string} identLanguage - Target languages to translate to
   * @return {Map}
   * @throws {Error}
   * @private
   */
  static _translate (ident, identLanguage) {
    // unify
    ident = Array.from(new Set(ident))

    if (typeof identLanguage === 'string') {
      identLanguage = [identLanguage]
    } else if (!(identLanguage instanceof Array)) {
      throw new Error('invalid identLanguage')
    }
    identLanguage.push(Culture.uiLanguage, CULTURE_DEFAULT_LANGUAGE_IDENT)
    // remove duplicates and empty values
    identLanguage = Array.from(new Set(identLanguage)).filter(v => v)

    const _mapTranslation = new Map()
    ident.forEach((i) => {
      let translation = ''
      if (i.match(/^[0-9]+$/)) {
        translation = Culture.formatDateTime(parseInt(i))
      } else {
        const _iL = identLanguage.slice(0)
        while (_iL.length > 0 && !translation) {
          translation = Culture._cacheTranslation.get(_iL.shift() + ':' + i)
        }
      }
      _mapTranslation.set(String(i), translation || i)
    })

    return _mapTranslation
  }

  /**
   * @return {Culture}
   * @private
   */
  static _make (force = false) {
    if (typeof Culture._db === 'undefined' || force) {
      Culture._db = Db.connect()

      Culture._cacheTranslation = new Map(
        Culture._db.allAsArray('SELECT * FROM culture').map(r => [r.language_ident + ':' + r.ident, r.text])
      )
      Culture._cacheIdentLanguages =
        Culture._db.allAsArray('SELECT language_ident FROM language').map(r => r.language_ident)
    }

    return Culture
  }
}

module.exports = { CULTURE_DEFAULT_LANGUAGE_IDENT, Culture }

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

// @see https://umbrellajs.com
/* global u */

// @see @see https://developer.mozilla.org/en-US/docs/Web/API/Fetch_API
/* global fetch */

if (!u || !fetch) {
  throw new Error('invalid state')
}

class UiCulture {
  /**
   * @public
   */
  static make () {
    UiCulture._cache = {}

    u('select[name="uiLanguage"]').off('change').handle('change', (e) => {
      u(e.target).parent().addClass('is-loading')
      UiCulture.translate(true).then(() => {
        setTimeout(() => { u(e.target).parent().removeClass('is-loading') }, 200)
      })
    })
  }

  /**
   * @param changeUILanguage {boolean}
   * @returns {Promise<void>}
   * @public
   */
  static async translate (changeUILanguage = false) {
    const uiLanguage = u('select[name="uiLanguage"]').first().value
    if (!UiCulture._cache[uiLanguage]) {
      UiCulture._cache[uiLanguage] = {}
    }

    let response = {}
    const o = this._getTranslationObject(uiLanguage)

    if (changeUILanguage || Object.keys(o.translate).length) {
      o.translate.uiLanguage = uiLanguage
      response = await UiCulture._postToTranslate(o.translate)
      for (const type in response) {
        (new Map(response[type])).forEach((v, k) => UiCulture._cache[uiLanguage][type].set(String(k), v))
      }
    }

    if (changeUILanguage) {
      u('[data-culture-lang]').attr('lang', uiLanguage)
      u('[data-culture-lang]').attr('data-culture-lang', uiLanguage)
    }

    for (const type in UiCulture._cache[uiLanguage]) {
      if (Object.prototype.hasOwnProperty.call(UiCulture._cache[uiLanguage], type)) {
        (new Map(UiCulture._cache[uiLanguage][type])).forEach((v, k) => {
          if (v) {
            const _e = u(`[data-culture-${type}="${k}"]`)
            switch (type) {
              case 'text':
              case 'datetime':
                _e.text(v)
                break
              default:
                _e.attr(type, v)
                break
            }
          }
        })
      }
    }
  }

  /**
   * @param uiLanguage {string}
   * @returns {Object}
   * @private
   */
  static _getTranslationObject (uiLanguage) {
    const scope = {}
    const translate = {}
    for (const type of ['text', 'title', 'placeholder', 'datetime']) {
      scope[type] = Array.from(
        new Set(u('[data-culture-' + type + ']').array(node => [u(node).data('culture-' + type)]))
      ).filter(v => v)

      if (!UiCulture._cache[uiLanguage][type]) {
        UiCulture._cache[uiLanguage][type] = new Map()
        translate[type] = scope[type]
      } else {
        const _a = scope[type].filter(v => !Array.from(UiCulture._cache[uiLanguage][type].keys()).includes(v))
        if (_a.length) {
          translate[type] = _a
        }
      }
    }

    return { scope: scope, translate: translate }
  }

  /**
   * @param objBody {Object}
   * @returns {Promise<Object>}
   * @private
   */
  static async _postToTranslate (objBody) {
    return (await fetch('/translate', {
      method: 'POST',
      headers: {
        Accept: 'application/json',
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(objBody)
    })).json()
  }
}

// check if DOM is already available
if (document.readyState === 'complete' || document.readyState === 'interactive') {
  // call on next available tick
  setTimeout(UiCulture.make, 1)
} else {
  document.addEventListener('DOMContentLoaded', UiCulture.make)
}

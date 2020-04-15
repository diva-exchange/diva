/*!
 * UiCulture - Multi-Culture / Translation
 * Copyright(c) 2019 Konrad Baechler, https://diva.exchange
 * GPL3 Licensed
 */

'use strict'

// Umbrella, @see https://umbrellajs.com
var _u = u || false
// fetch API, @see https://developer.mozilla.org/en-US/docs/Web/API/Fetch_API
var _fetch = fetch || false

if (!_u || !_fetch) {
  throw new Error('invalid state')
}

class UiCulture {
  /**
   * @public
   */
  static make () {
    UiCulture._cache = {}

    _u('select[name="uiLanguage"]').off('change').handle('change', (e) => {
      _u(e.target).parent().addClass('is-loading')
      UiCulture.translate(true).then(() => {
        setTimeout(() => { _u(e.target).parent().removeClass('is-loading') }, 200)
      })
    })
  }

  /**
   * @param changeUILanguage {boolean}
   * @returns {Promise<void>}
   * @public
   */
  static async translate (changeUILanguage = false) {
    const uiLanguage = _u('select[name="uiLanguage"]').first().value
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
      _u('[data-culture-lang]').attr('lang', uiLanguage)
      _u('[data-culture-lang]').attr('data-culture-lang', uiLanguage)
    }

    for (const type in UiCulture._cache[uiLanguage]) {
      if (Object.prototype.hasOwnProperty.call(UiCulture._cache[uiLanguage], type)) {
        (new Map(UiCulture._cache[uiLanguage][type])).forEach((v, k) => {
          if (v) {
            const _e = _u(`[data-culture-${type}="${k}"]`)
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
        new Set(_u('[data-culture-' + type + ']').array(node => [_u(node).data('culture-' + type)]))
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
    return (await _fetch('/translate', {
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

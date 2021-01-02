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

// Umbrella, @see https://umbrellajs.com
var u = u || false
// fetch API, @see https://developer.mozilla.org/en-US/docs/Web/API/Fetch_API
var fetch = fetch || false

if (!u || !fetch) {
  throw new Error('invalid state')
}

class UiUser {
  /**
   * @public
   */
  static make () {
  }

  /**
   * @public
   */
  static newUser () {
    u('#creating, #success, #error').addClass('is-hidden')

    u('form#newuser').handle('submit', async () => {
      u('#success, #error').addClass('is-hidden')
      u('#creating').removeClass('is-hidden')
      u('form#newuser button#create').addClass('is-loading').disabled = true

      const response = await (await fetch('/register', {
        method: 'POST',
        headers: {
          Accept: 'application/json',
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ password: u('form#newuser #password').first().value })
      })).json()

      u('#creating').addClass('is-hidden')
      u('form#newuser button#create').removeClass('is-loading').disabled = false
      u('form#newuser #password').first().value = ''

      if (!response.error) {
        const account = response.username + '@' + response.domain
        u('#success a').text(account).parent().removeClass('is-hidden')
        u('a[href^="/auth"]').attr('href', '/auth?account=' + account)
      } else {
        u('#error').text(response.message).removeClass('is-hidden')
      }
    })
  }

  /**
   * @public
   */
  static auth () {
    u('form#auth').handle('submit', async () => {
      u('form#auth button#login').addClass('is-loading')

      const account = u('form#auth #account').first().value

      const response = await (await fetch('/login', {
        method: 'POST',
        headers: {
          Accept: 'application/json',
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          account: account,
          password: u('form#auth #password').first().value
        })
      })).json()

      if (response.isAuthenticated) {
        window.location.replace(response.pathView)
      } else {
        u('form#auth #password').first().value = ''
        u('form#auth button#login').removeClass('is-loading')

        // @TODO generic and consistent error UX handling
        u('#error').removeClass('is-hidden')
        setTimeout(() => u('#error').addClass('is-hidden'), 5000)
      }
    })
  }
}

UiUser.make()

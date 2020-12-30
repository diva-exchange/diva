/*!
 * Diva User Test suite
 * Copyright(c) 2019 Konrad Baechler, https://diva.exchange
 * GPL3 Licensed
 */

'use strict'

import { describe, it, before, after, beforeEach, afterEach } from 'mocha'
import { User } from '../../../src/auth/user'

var chai = require('chai')
var chaiAsPromised = require('chai-as-promised')
var assert = chai.assert

chai.use(chaiAsPromised)

/**
 * Project: diva
 * Context: diva/config/user
 */
describe('//diva// /diva/config/user', function () {
  const USER = 'konrad_test@testnet'
  const PWD = '1234567890-abc'

  function createTestUser () {
    return User.create(USER, PWD)
  }

  async function deleteTestUser () {
    try {
      await User.delete(USER, PWD)
    } catch (error) {
    }
  }

  describe('User Instantiation', function () {
    it('User is a function', function () {
      assert.isFunction(User)
    })

    it('Empty username throws Error', function () {
      assert.isRejected(
        User.create('', ''),
        'Invalid account'
      )
    })

    it('Invalid password throws Error', function () {
      assert.isRejected(
        User.create('konrad_test@testnet', '1234567890abc'),
        'Invalid password'
      )
    })
  })

  describe('Create User', function () {
    beforeEach('prepare user', function () {
      this.timeout(10000)
      deleteTestUser()
    })

    afterEach('clean up user', function () {
      this.timeout(10000)
      deleteTestUser()
    })

    it('Valid user', async function () {
      this.timeout(10000)
      const usr = await createTestUser()
      assert.instanceOf(usr, User)
    })
  })

  describe('Delete User', function () {
    before('create user', function () {
      this.timeout(10000)
      createTestUser()
    })

    after('clean up user', function () {
      this.timeout(10000)
      deleteTestUser()
    })

    it('Deletion fails', function () {
      this.timeout(10000)
      assert.throw(function () {
        User.delete(USER, '234567890-abcd')
      }, 'User not available')
    })
  })
})

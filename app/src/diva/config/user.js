/*!
 * Diva User
 * Copyright(c) 2019-2020 Konrad Baechler, https://diva.exchange
 * GPL3 Licensed
 */
'use strict'

import request from 'request-promise-native'
import sodium from 'sodium-native'

import { Config } from '../../config'
import { Db } from '../../db'
import { JOB_STATUS_OK } from '../../job'
import { KeyStore } from '../../key-store'
import { shuffleArray } from '../../utils'

const REGEX_IDENT_ACCOUNT = /^[a-z_0-9]{1,32}@([a-zA-Z]([a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?\.)*[a-zA-Z]([a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?$/
const REGEX_PASSWORD = /^(?=.*[A-Za-z])(?=.*\d)(?=.*[-+_,;£~$!%*#?&])[A-Za-z\d\-+_,;£~$!%*#?&]{10,32}$/

export class User {
  /**
   * @param identDomain {string} Omit or use an asterisk (*) to get all users of all domains
   * @returns {Array} Array of records (a record is an object: {account_ident, domain_ident})
   */
  static allAsArray (identDomain = '*') {
    let sql = `SELECT account_ident, domain_ident FROM user
      WHERE @domain_ident = @domain_ident`
    if (identDomain !== '*') {
      sql += ' AND domain_ident = @domain_ident'
    }
    return Db.connect().allAsArray(sql, { domain_ident: identDomain })
  }

  /**
   * Register a new User on the blockchain
   *
   * @param password {string}
   * @param identDomain {string}
   * @returns {Promise<User>}
   * @public
   */
  static async register (password, identDomain = '') {
    return (new User(password, identDomain))._createKeyPairSign()._registerUser()
  }

  /**
   * Create a new User
   *
   * @param identAccount {string}
   * @param password {string}
   * @returns {Promise<string>} Returns account identifier (username@domain)
   * @throws {Error} If creation fails
   * @public
   */
  static async create (identAccount, password = '') {
    if (!identAccount.match(REGEX_IDENT_ACCOUNT)) {
      throw new Error('Invalid account')
    }

    return (new User(password, identAccount))._createKeyPairSign()._add()
  }

  /**
   * Open an existing user
   *
   * @param identAccount {string}
   * @param password {string}
   * @returns {User}
   * @throws {Error} If user is not accessible/available
   * @public
   */
  static open (identAccount, password) {
    if (!identAccount.match(REGEX_IDENT_ACCOUNT)) {
      throw new Error('Invalid account')
    }

    return new User(password, identAccount)
  }

  /**
   * Delete an existing user
   *
   * @param identAccount {string}
   * @param password {string}
   * @throws {Error} If deletion fails
   * @public
   */
  static delete (identAccount, password) {
    if (!identAccount.match(REGEX_IDENT_ACCOUNT)) {
      throw new Error('Invalid account')
    }
    (new User(password, identAccount))._delete()
  }

  /**
   * @param password {string}
   * @param identAccount {string}
   * @private
   */
  constructor (password, identAccount) {
    if (!password.match(REGEX_PASSWORD)) {
      throw new Error('Invalid password')
    }
    this._identAccount = ''
    this._username = ''
    if (identAccount.match(/^[^@]+@[^@]+$/)) {
      this._identAccount = identAccount
      this._username = identAccount.split('@')[0]
      this._domain = identAccount.split('@')[1]
    } else {
      this._domain = identAccount
    }

    this._db = Db.connect()
    this._config = Config.make()

    /** @type Buffer */
    this._bufferPassword = sodium.sodium_malloc(password.length)
    sodium.sodium_mlock(this._bufferPassword)
    this._bufferPassword.fill(password)

    if (this._identAccount !== '') {
      this._fetch()
    }
  }

  /**
   * @returns {string}
   */
  getUsername () {
    return this._username
  }

  /**
   * @returns {string}
   */
  getDomain () {
    return this._domain
  }

  /**
   * @returns {string}
   */
  getAccountIdent () {
    return this._identAccount
  }

  /**
   * @returns {string} Public key, hex format
   */
  getPublicKey () {
    return this._bufferPublicKey.toString('hex')
  }

  /**
   * @returns {Promise<User>}
   * @private
   */
  async _registerUser () {
    const peer = shuffleArray(this._config.getValueByKey('diva.api.uri'))[0]
    const proxy = peer.match(/^.+\.i2p(:[\d]+)?$/) ? 'http://' + this._config.getValueByKey('i2p.http.proxy') : ''

    let url = 'http://' + peer + '/user/create?publickey=' + this._bufferPublicKey.toString('hex')
    if (this._domain) {
      url += '&domain=' + this._domain
    }

    let response = await request({
      proxy: proxy,
      url: url,
      json: true
    })
    if (!response.idJob) {
      throw new Error(JSON.stringify(response))
    }

    response = await request({
      proxy: proxy,
      url: 'http://' + peer + '/job?idJob=' + response.idJob,
      json: true
    })
    if (!response.job_status_ident || response.job_status_ident !== JOB_STATUS_OK) {
      throw new Error(JSON.stringify(response))
    }

    response = JSON.parse(response.response)
    this._username = response.username
    this._domain = response.domain
    this._identAccount = this._username + '@' + this._domain
    return this._add()
  }

  /**
   * Fetch a user from the database
   *
   * @return {User}
   * @private
   */
  _fetch () {
    const arrayUser = this._db.allAsArray(
      'SELECT * FROM user WHERE account_ident = @account_ident',
      {
        account_ident: this._identAccount
      })

    // verify the password
    if (arrayUser.length === 1 &&
      sodium.crypto_pwhash_str_verify(Buffer.from(arrayUser[0].passwordhash, 'hex'), this._bufferPassword)) {
      this._bufferNonce = Buffer.from(arrayUser[0].nonce, 'hex')
      this._bufferPublicKey = Buffer.from(arrayUser[0].publickey, 'hex')
      this._bufferPrivateKeyEncrypted = Buffer.from(arrayUser[0].privatekeyenc, 'hex')

      /** @type {Buffer} */
      const bufferPrivateKey = sodium.sodium_malloc(
        this._bufferPrivateKeyEncrypted.byteLength - sodium.crypto_secretbox_MACBYTES)
      sodium.sodium_mlock(bufferPrivateKey)

      /** @type {Buffer} */
      const bufferSecret = sodium.sodium_malloc(sodium.crypto_secretbox_KEYBYTES)
      sodium.sodium_mlock(bufferSecret)
      bufferSecret.fill(this._bufferPassword.toString())

      if (!sodium.crypto_secretbox_open_easy(
        bufferPrivateKey,
        this._bufferPrivateKeyEncrypted,
        this._bufferNonce,
        bufferSecret
      )) {
        throw new Error('Access denied')
      }
      KeyStore.make().set(this._identAccount + ':keyPrivate', bufferPrivateKey)
      sodium.sodium_munlock(bufferPrivateKey)
      sodium.sodium_munlock(bufferSecret)
    } else {
      throw new Error('User not available')
    }

    return this
  }

  /**
   * Add a new User
   *
   * @returns {User}
   * @throws {Error} On invalid crypto keys
   * @private
   */
  _add () {
    this._db.insert(
      'INSERT INTO user (account_ident, domain_ident, passwordhash, nonce, publickey, privatekeyenc) VALUES \
      (@account_ident, @domain_ident, @passwordhash,  @nonce, @publickey, @privatekeyenc)',
      {
        account_ident: this._identAccount,
        domain_ident: this._domain,
        passwordhash: this._hashPassword(),
        nonce: this._bufferNonce.toString('hex'),
        publickey: this._bufferPublicKey.toString('hex'),
        privatekeyenc: this._bufferPrivateKeyEncrypted.toString('hex')
      })

    return this
  }

  /**
   * Delete a User
   *
   * @returns {User}
   * @throws {Error} If deletion fails
   * @private
   */
  _delete () {
    this._db.delete(
      'DELETE FROM user WHERE account_ident = @account_ident',
      {
        account_ident: this._identAccount
      })

    this._identAccount = ''
    this._domain = ''
    sodium.sodium_munlock(this._bufferPassword)
    delete this._bufferPassword

    sodium.sodium_memzero(this._bufferNonce)
    sodium.sodium_memzero(this._bufferPublicKey)
    sodium.sodium_memzero(this._bufferPrivateKeyEncrypted)
  }

  /**
   * Create a password hash from password
   *
   * @return {string} Password hash as a hex string
   * @private
   */
  _hashPassword () {
    /** @type {Buffer} */
    const bufferPasswordHash = sodium.sodium_malloc(sodium.crypto_pwhash_STRBYTES)
    sodium.crypto_pwhash_str(
      bufferPasswordHash,
      this._bufferPassword,
      sodium.crypto_pwhash_OPSLIMIT_SENSITIVE,
      sodium.crypto_pwhash_MEMLIMIT_SENSITIVE
    )
    const stringHash = bufferPasswordHash.toString('hex')
    sodium.sodium_munlock(bufferPasswordHash)
    return stringHash
  }

  /**
   * Create a public/private key pair usable to create signatures
   *
   * @returns {User}
   * @private
   */
  _createKeyPairSign () {
    /** @type {Buffer} */
    const bufferPrivateKey = sodium.sodium_malloc(sodium.crypto_sign_SECRETKEYBYTES)
    sodium.sodium_mlock(bufferPrivateKey)

    /** @type {Buffer} */
    this._bufferPublicKey = sodium.sodium_malloc(sodium.crypto_sign_PUBLICKEYBYTES)

    /** @type {Buffer} */
    this._bufferPrivateKeyEncrypted =
      sodium.sodium_malloc(bufferPrivateKey.length + sodium.crypto_secretbox_MACBYTES)

    /** @type {Buffer} */
    this._bufferNonce = sodium.sodium_malloc(sodium.crypto_secretbox_NONCEBYTES)
    sodium.randombytes_buf(this._bufferNonce)

    /** @type {Buffer} */
    const bufferSecret = sodium.sodium_malloc(sodium.crypto_secretbox_KEYBYTES)
    sodium.sodium_mlock(bufferSecret)
    bufferSecret.fill(this._bufferPassword.toString())

    sodium.crypto_sign_keypair(this._bufferPublicKey, bufferPrivateKey)

    sodium.crypto_secretbox_easy(
      this._bufferPrivateKeyEncrypted,
      bufferPrivateKey,
      this._bufferNonce,
      bufferSecret
    )

    KeyStore.make().set(this._identAccount + ':keyPrivate', bufferPrivateKey)
    sodium.sodium_munlock(bufferPrivateKey)
    sodium.sodium_munlock(bufferSecret)

    return this
  }
}

module.exports = { User }

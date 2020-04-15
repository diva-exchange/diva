/*!
 * iroha API
 * Copyright(c) 2019-2020 Konrad Baechler, https://diva.exchange
 * GPL3 Licensed
 */

'use strict'

import fs from 'fs'
import grpc from 'grpc'
import {
  QueryService_v1Client,
  CommandService_v1Client
} from 'iroha-helpers/lib/proto/endpoint_grpc_pb'
import { commands, queries } from 'iroha-helpers'
import path from 'path'
import sodium from 'sodium-native'

import { Config } from '../config'
import { IrohaDb, IROHA_ORDER_VERSION_CURRENT } from './iroha-db'

const TIMEOUT_COMMAND = 5000
const REGEX_USERNAME = /^[a-z_0-9]{1,32}$/
const REGEX_DOMAINID = /^([a-zA-Z]([a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?\.)*[a-zA-Z]([a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?$/

const API_ERROR_FAIL_CONNECT_IROHA = 'failed to connect to iroha'

export class Iroha {
  /**
   * Factory, create a new Iroha Instance
   *
   * @param torii {String} Example: localhost:50051
   * @param creatorAccountId {String} Example: myuser@mydomain - private key must be accessible
   * @returns {Promise<Iroha>}
   */
  static async make (torii = '', creatorAccountId = '') {
    const config = Config.make()
    return new Iroha(
      torii || config.getValueByKey('iroha.torii'),
      creatorAccountId || config.getValueByKey('iroha.creator')
    )
  }

  /**
   * @param torii {String} Examples: localhost:51151 or 127.0.0.1:50051
   * @param creatorAccountId {String} Example: myuser@mydomain - private key must be accessible
   * @returns {Promise<Iroha>}
   * @private
   */
  constructor (torii, creatorAccountId) {
    // load private key
    const pathPrivateKey = path.join(__dirname, '/../../data/', creatorAccountId + '.priv')
    if (!fs.existsSync(pathPrivateKey)) {
      throw new Error(API_ERROR_FAIL_CONNECT_IROHA)
    }

    return this._init(torii, creatorAccountId, pathPrivateKey)
  }

  /**
   * @param torii {String} Examples: localhost:51151 or 127.0.0.1:50051
   * @param creatorAccountId {String} Example: myuser@mydomain - private key must be accessible
   * @param pathPrivateKey {String}
   * @returns {Promise<Iroha>}
   * @private
   */
  async _init (torii, creatorAccountId, pathPrivateKey) {
    this._irohaDb = await IrohaDb.make()

    this._creatorAccountId = creatorAccountId

    /** @type {Buffer} */
    this._bufferCreatorPrivateKey = sodium.sodium_malloc(sodium.crypto_box_SECRETKEYBYTES)
      .fill(Buffer.from(fs.readFileSync(pathPrivateKey).toString(), 'hex'))

    this._commandService = new CommandService_v1Client(
      torii,
      grpc.credentials.createInsecure()
    )

    this._queryService = new QueryService_v1Client(
      torii,
      grpc.credentials.createInsecure()
    )

    return this
  }

  /**
   * @param onCommit {Function}
   * @param onError {Function}
   */
  watch (onCommit, onError) {
    // generic block commit listener
    queries.fetchCommits(
      {
        privateKey: this._bufferCreatorPrivateKey,
        creatorAccountId: this._creatorAccountId,
        queryService: this._queryService
      },
      (block) => onCommit(block),
      (error) => onError(error)
    )
  }

  /**
   * @returns {IrohaDb}
   */
  getIrohaDb () {
    return this._irohaDb
  }

  /**
   * Create a new account
   *
   * @TODO look at quorum
   *
   * @param username {String}
   * @param idDomain {String}
   * @param publicKey {String}
   * @returns {Promise<Object>}
   * @throws {Error}
   * @public
   */
  async createAccount (username, idDomain, publicKey) {
    this._validateAccountId(username + '@' + idDomain)

    const response = await commands.createAccount(
      {
        privateKeys: [this._bufferCreatorPrivateKey],
        creatorAccountId: this._creatorAccountId,
        quorum: 1,
        commandService: this._commandService,
        timeoutLimit: TIMEOUT_COMMAND
      },
      {
        accountName: username,
        domainId: idDomain,
        publicKey: publicKey
      })

    return {
      username: username,
      domain: idDomain,
      response: response
    }
  }

  /**
   * @param idAccount {string}
   * @returns {Promise}
   * @throws {Error}
   * @public
   */
  async getAccount (idAccount) {
    return queries.getAccount(
      {
        privateKey: this._bufferCreatorPrivateKey,
        creatorAccountId: this._creatorAccountId,
        queryService: this._queryService,
        timeoutLimit: TIMEOUT_COMMAND
      },
      {
        accountId: idAccount
      }
    )
  }

  /**
   * @param idAccount {string}
   * @returns {Promise}
   * @throws {Error}
   * @public
   */
  async getSignatories (idAccount) {
    return queries.getSignatories(
      {
        privateKey: this._bufferCreatorPrivateKey,
        creatorAccountId: this._creatorAccountId,
        queryService: this._queryService,
        timeoutLimit: TIMEOUT_COMMAND
      },
      {
        accountId: idAccount
      }
    )
  }

  /**
   * Check account id validity
   *
   * @param idAccount
   * @throws {Error} If the account id is invalid
   * @private
   */
  _validateAccountId (idAccount) {
    const _a = idAccount.split('@')

    if (typeof _a[0] === 'undefined' || !_a[0].match(REGEX_USERNAME)) {
      throw new Error('invalid username')
    }
    if (typeof _a[1] === 'undefined' || !_a[1].match(REGEX_DOMAINID)) {
      throw new Error('invalid domainid')
    }
  }

  /**
   * @param idAccount {string}
   * @param jsonData {string}
   * @param signature {string} Base64 encoded signature
   * @returns {Promise<string>}
   * @throws {Error}
   * @public
   */
  async setOrder (idAccount, jsonData, signature) {
    this._validateAccountId(idAccount)

    const bufferPublicKey = Buffer.from(await this._irohaDb.getPublicKey(idAccount), 'hex')
    const bufferData = Buffer.from(jsonData)

    // check validity of data
    if (!sodium.crypto_sign_verify_detached(Buffer.from(signature, 'base64'), bufferData, bufferPublicKey)) {
      throw new Error('invalid signature')
    }

    const objData = JSON.parse(jsonData)
    // check completeness of data
    if (!objData.contract || !objData.type || !objData.signatureState || !objData.arrayCurrent || !objData.arrayDelta) {
      throw new Error('invalid data')
    }

    // check validity of order book state
    const objState = await this._irohaDb.getOrderState(idAccount, objData.contract, objData.type)
    const bufferState = Buffer.from(JSON.stringify(objState.arrayCurrent || []))
    if (!sodium.crypto_sign_verify_detached(Buffer.from(objData.signatureState, 'base64'),
      bufferState, bufferPublicKey)) {
      throw new Error('invalid order state')
    }

    return commands.setAccountDetail(
      {
        privateKeys: [this._bufferCreatorPrivateKey],
        creatorAccountId: this._creatorAccountId,
        quorum: 1,
        commandService: this._commandService,
        timeoutLimit: TIMEOUT_COMMAND
      },
      {
        accountId: idAccount,
        key: 'ob' + objData.contract + 't' + objData.type,
        value: await IrohaDb.packOrder(IROHA_ORDER_VERSION_CURRENT, objData)
      }
    )
      .then(() => {
        return 'ob' + objData.contract + 't' + objData.type
      })
  }
}

module.exports = { Iroha }

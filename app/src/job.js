/*!
 * Job management
 * Copyright(c) 2019-2020 Konrad Baechler, https://diva.exchange
 * GPL3 Licensed
 */
'use strict'

import { Db } from './db'

export const JOB_INTERFACE_UI = 'jiUI'
export const JOB_INTERFACE_API = 'jiAPI'
export const JOB_STATUS_PENDING = 'jsPENDING'
export const JOB_STATUS_OK = 'jsOK'
export const JOB_STATUS_ERROR = 'jsERROR'

export class Job {
  /**
   * Add a new job
   *
   * @param jobInterface {string}
   * @param request {string}
   * @param promise {Function}
   * @returns {Promise<number>} Job id
   * @public
   */
  static async add (jobInterface, request, promise) {
    switch (jobInterface) {
      case JOB_INTERFACE_UI:
      case JOB_INTERFACE_API:
        break
      default:
        throw new Error('Unknown job interface')
    }

    if (!request) {
      throw new Error('Missing request')
    }

    return (new Job())._add(jobInterface, request, promise)
  }

  /**
   * Get the status of a job
   *
   * @param idJob {number}
   * @returns {string}
   * @public
   */
  static getStatusById (idJob) {
    return (new Job())._getRecordById(idJob).job_status_ident || ''
  }

  /**
   * Get the response of a job
   *
   * @param idJob {number}
   * @returns {object}
   */
  static getResponseById (idJob) {
    return (new Job())._getRecordById(idJob).response || {}
  }

  /**
   * @returns {Array}
   */
  static getJobByIdAsArray (idJob) {
    return (new Job())._getRecordById(idJob)
  }

  /**
   * @private
   */
  constructor () {
    this._db = Db.connect()
  }

  /**
   * @param jobInterface {string}
   * @param request {string}
   * @param promise {Function}
   * @returns {Promise<number>}
   * @public
   */
  async _add (jobInterface, request, promise) {
    // create the job on the database
    const idJob = this._createJob(JOB_STATUS_PENDING, jobInterface, request)

    let status = JOB_STATUS_ERROR
    let response
    try {
      response = JSON.stringify(await promise())
      status = JOB_STATUS_OK
    } catch (error) {
      response = error.toString()
    }
    this._updateJob(idJob, status, response)

    return idJob
  }

  /**
   * @param rowid
   * @returns {Array}
   * @private
   */
  _getRecordById (rowid) {
    const a = this._db.allAsArray('SELECT rowid AS idJob, * FROM job WHERE rowid = @rowid',
      {
        rowid: rowid
      })
    return a.length > 0 ? a[0] : []
  }

  /**
   * @param status {string}
   * @param interfaceJob {string}
   * @param request {string}
   * @return {number} Job id
   * @private
   */
  _createJob (status, interfaceJob, request) {
    return this._db.insert(`INSERT INTO job (job_status_ident, job_interface_ident, request)
      VALUES (@job_status_ident, @job_interface_ident, @request)`,
    {
      job_status_ident: status,
      job_interface_ident: interfaceJob,
      request: request
    }).lastInsertRowid
  }

  /**
   * @param id {number}
   * @param status {string}
   * @param response {string}
   * @private
   */
  _updateJob (id, status, response) {
    this._db.update(`UPDATE job SET
        job_status_ident = @job_status_ident,
        response = @response,
        response_datetime_utc = STRFTIME('%Y-%m-%d %H:%M:%f', 'NOW')
      WHERE
        rowid = @rowid`,
    {
      job_status_ident: status,
      response: response,
      rowid: id
    })
  }
}

module.exports = { JOB_INTERFACE_UI, JOB_INTERFACE_API, JOB_STATUS_PENDING, JOB_STATUS_OK, JOB_STATUS_ERROR, Job }

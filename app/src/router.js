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

import compression from 'compression'
import createError from 'http-errors'
import express from 'express'
import path from 'path'
import session from 'express-session'

import { Culture } from './view/culture'
import { Logger } from '@diva.exchange/diva-logger'

// @TODO ES6 import
const SessionStore = require('./view/session-store')(session)

const ROUTER_INVALID_SESSION_NAME = 'invalid session name'

export class Router {
  /**
   * @param routes {Object}
   * @throws {Error}
   * @protected
   */
  constructor (routes = {}) {
    /** @type {Function} */
    this._app = express()
    // generic
    this._app.set('x-powered-by', false)

    // compression
    this._app.use(compression())

    // static content
    if (routes.hasStaticContent) {
      this._app.use(express.static(path.join(__dirname, '/../static/')))
    }

    // session
    if (routes.session) {
      if (!routes.session.name) {
        throw new Error(ROUTER_INVALID_SESSION_NAME)
      }
      this._app.use(
        session({
          cookie: {
            httpOnly: true,
            secure: false,
            sameSite: 'strict'
          },
          name: routes.session.name,
          resave: false,
          saveUninitialized: false,
          secret: SessionStore.getSessionKey(routes.session.name),
          store: SessionStore.make({ maxAge: 60 * 60 * 1000 })
        })
      )
    }

    // view engine setup
    if (routes.hasViews) {
      this._app.set('views', path.join(__dirname, '/../view/'))
      this._app.set('view engine', 'pug')
      this._app.use((req, res, next) => {
        res.locals.Culture = Culture.init(req)
        if (req.session) {
          res.locals.session = req.session
        }
        next()
      })
    }

    this._app.use(express.json())

    // attach routes, supports GET and POST
    if (routes.get && Object.entries(routes.get).length > 0) {
      Object.entries(routes.get).forEach(
        ([path, controller]) => this._app.get(path, (req, res, next) => {
          if (routes.session && !req.session.cookie.domain) {
            req.session.cookie.domain = req.hostname
          }
          if (routes.storePathView && routes.storePathView.indexOf(req.path) >= 0) {
            if (req.session.stateView && req.session.stateView[req.session.account]) {
              req.session.stateView[req.session.account].pathView = req.path
            }
          }
          controller.execute(req, res, next)
        })
      )
    }
    if (routes.post && Object.entries(routes.post).length > 0) {
      Object.entries(routes.post).forEach(
        ([path, controller]) => this._app.post(path, (req, res, next) => {
          controller.execute(req, res, next)
        })
      )
    }

    // catch unavailable favicon.ico
    this._app.get('/favicon.ico', (req, res) => res.sendStatus(204))

    // catch 404 and forward to error handler
    this._app.use((req, res, next) => {
      next(createError(404))
    })

    // error handler
    this._app.use((err, req, res, next) => Router._errorHandler(err, req, res, next))
  }

  /**
   * @returns {Router}
   */
  init () {
    return this
  }

  /**
   * @returns {Function}
   * @public
   */
  getApp () {
    return this._app
  }

  /**
   * @param err
   * @param req
   * @param res
   * @param next
   */
  static _errorHandler (err, req, res, next) {
    Logger.trace(req.originalUrl).warn(err)

    res.locals.status = err.status
    res.locals.message = err.message
    res.locals.error = req.app.get('env') === 'development' ? err : {}

    res.status(err.status || 500)

    // render the error page
    if (req.accepts('html')) {
      res.render('error')
    } else {
      res.json({
        message: res.locals.message,
        error: res.locals.error
      })
    }
  }
}

module.exports = { Router }

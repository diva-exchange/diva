#!/usr/bin/env bash

function _stop() {
  running "Stop diva"
  # npm stop # Orioltf: there's not a `stop` script yet. Trying `pm2 kill` instead
  pm2 kill

  running "Stop iroha and i2pd"
  docker stop i2pd iroha
}

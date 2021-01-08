#!/usr/bin/env bash

function _stop() {
  running "Stop diva"
  npm stop

  running "Stop iroha and i2pd"
  docker stop i2pd iroha
}

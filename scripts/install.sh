#!/usr/bin/env bash

###############################################################################
# Install
###############################################################################

# include my library helpers for colorized echo and require_brew, etc
CUR_DIR=$(pwd)
source "$CUR_DIR/scripts/echos.sh"
source "$CUR_DIR/scripts/helpers.sh"

############################################################################

bot "Installing diva"

if command_exists docker; then
  running "Pull i2p"
  docker pull divax/i2p:latest

  running "Pull iroha"
  docker pull divax/iroha
else
  error "Install Docker and Docker Compose before you install diva."
fi

running "PM2 process manager is required, installing"
try_nvm
(! command_exists pm2) && npm i -g pm2

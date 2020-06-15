#!/usr/bin/env bash

###############################################################################
# Start
###############################################################################

CUR_DIR=$(pwd)
source "$CUR_DIR/scripts/echos.sh"
source "$CUR_DIR/scripts/helpers.sh"

############################################################################

bot "Start diva"

running "Start the docker container for I2P"
docker run -p 7070:7070 -p 4444:4444 -p 4445:4445 -d --name i2pd divax/i2p:latest

bot "Start the docker container for Iroha"

running "Create the volume"
docker volume create iroha

running "Start the container"
docker run -d -p 25432:5432 -p 50151:50051 --name=iroha -v iroha:/opt/iroha/data divax/iroha:latest

try_nvm

running "Install dependencies"
npm ci

running "Install the diva database"
npm run install

running "Start diva"
npm start

running "Opening I2Pd webconsole…"
open http://localhost:7070

running "Open diva interface"
open http://localhost:3911

running "Open API interface"
open http://localhost:3912/

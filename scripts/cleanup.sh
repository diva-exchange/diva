#!/usr/bin/env bash

###############################################################################
# Cleanup
###############################################################################

CUR_DIR=$(pwd)
source "$CUR_DIR/scripts/echos.sh"
source "$CUR_DIR/scripts/helpers.sh"
source "$CUR_DIR/scripts/commons.sh"

############################################################################

bot "Stopping and cleaning diva"

read -p "Cleanup diva, ⚠️ ❗️ Attention: diva data will be removed. Are you sure? [y|N] " response
if [[ $response =~ (yes|y|Y) ]];then
  action "Data clean up"
  _stop

  running "remove all data"
  docker volume rm iroha

  ok "diva data cleaned! ☺️"
else
  info "diva data left untouched"
fi

read -p "Cleanup diva, ⚠️❗️ Attention: ALL containers will be removed. Are you sure? [y|N] " response
if [[ $response =~ (yes|y|Y) ]];then
  action "Docker Clean up"

  running "Prunning volumes"
  docker volume prune

  running "Prunning containers"
  docker system prune

  ok "System cleaned from diva! ☺️"
else
  info "docker left untouched"
fi

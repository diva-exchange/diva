#!/usr/bin/env bash

###############################################################################
# Stop
###############################################################################

# include my library helpers for colorized echo and require_brew, etc
CUR_DIR=$(pwd)
source "$CUR_DIR/scripts/echos.sh"
source "$CUR_DIR/scripts/helpers.sh"
source "$CUR_DIR/scripts/commons.sh"

############################################################################

bot "Stopping diva services, data and container will remain untouched"
_stop

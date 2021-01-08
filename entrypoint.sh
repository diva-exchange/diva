#!/bin/sh
#
# Author/Maintainer: konrad@diva.exchange
#
# Start nodeJS with the diva application.
#
set -e

# install
su node -c "cd /home/node/ && npm run install"

# start applications
su node -c "cd /home/node/ && npm start"

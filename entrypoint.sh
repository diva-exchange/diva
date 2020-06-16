#!/bin/sh
#
# Author/Maintainer: konrad@diva.exchange
#
# Start nodeJS with the diva application.
#
set -e

# install database
su node -c "cd /home/node/ && node -r esm ./app/bin/install-db"

# start applications
su node -c "cd /home/node/ && pm2-runtime start ecosystem.config.js --env production"

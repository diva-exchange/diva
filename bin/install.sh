#!/usr/bin/env bash
#
# Copyright (C) 2021 diva.exchange
#
# This program is free software: you can redistribute it and/or modify
# it under the terms of the GNU Affero General Public License as published by
# the Free Software Foundation, either version 3 of the License, or
# (at your option) any later version.
#
# This program is distributed in the hope that it will be useful,
# but WITHOUT ANY WARRANTY; without even the implied warranty of
# MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the
# GNU Affero General Public License for more details.
#
# You should have received a copy of the GNU Affero General Public License
# along with this program.  If not, see <https://www.gnu.org/licenses/>.
#
# Author/Maintainer: Konrad Bächler <konrad@diva.exchange>
#

###############################################################################
# Install
###############################################################################

PROJECT_PATH="$( cd "$( dirname "${BASH_SOURCE[0]}" )" >/dev/null 2>&1 && pwd )"/../
cd ${PROJECT_PATH}
PROJECT_PATH=`pwd`/

source "${PROJECT_PATH}bin/echos.sh"
source "${PROJECT_PATH}bin/helpers.sh"

############################################################################

bot "Installing DIVA"

if command_exists docker; then
  info "Docker requires root access"
  running "Purging existing testnet..."
  sudo docker-compose -f docker-compose/local-testnet.yml down --volumes

  running "Starting the local testnet..."
  sudo docker-compose -f docker-compose/local-testnet.yml pull
  sudo docker-compose -f docker-compose/local-testnet.yml up -d

  running "Installing application and database..."
  sudo rm -rf ${PROJECT_PATH}node_modules
  npm ci
  # @TODO more elegance, please - it needs to wait for the API to be ready (a GET request to the API must deliver JSON)
  sleep 30
  node -r esm ${PROJECT_PATH}app/install
else
  error "Install Docker and Docker Compose. See README."
fi

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

bot "Starting DIVA"

if command_exists docker; then
  info "Docker requires root access"
  running "Starting the local testnet..."
  sudo docker-compose -f docker-compose/local-testnet.yml pull
  sudo docker-compose -f docker-compose/local-testnet.yml up -d

  running "Fetching API access token from local filesystem..."
  sudo rm .api-token
  while [[ ! -f .api-token ]]
  do
    sleep 10
    sudo docker cp api.testnet.diva.local:/home/node/data/token .api-token
  done

  API_TOKEN=$(<.api-token)
  sudo rm .api-token

  NODE_ENV=development API_TOKEN=${API_TOKEN} node -r esm ${PROJECT_PATH}app/main
else
  error "Docker required. See README."
fi

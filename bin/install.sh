#!/usr/bin/env bash
#
# Copyright (C) 2020 diva.exchange
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

PROJECT_PATH="$( cd "$( dirname "${BASH_SOURCE[0]}" )" >/dev/null 2>&1 && pwd )/../"
cd ${PROJECT_PATH}

source "${PROJECT_PATH}bin/echos.sh"
source "${PROJECT_PATH}bin/helpers.sh"

############################################################################

bot "Installing diva"

if command_exists docker; then
  running "Pull i2p"
  sudo docker pull divax/i2p:latest

  running "Pull iroha"
  sudo docker pull divax/iroha:latest
  sudo docker pull divax/iroha-node:latest
else
  error "Install Docker and Docker Compose before you install diva."
fi

running "PM2 process manager is required, installing"
(! command_exists pm2) && sudo npm i -g pm2

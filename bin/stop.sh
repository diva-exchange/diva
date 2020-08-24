#!/usr/bin/env bash
#
#    Copyright (C) 2020 diva.exchange
#
#    This program is free software: you can redistribute it and/or modify
#    it under the terms of the GNU Affero General Public License as published by
#    the Free Software Foundation, either version 3 of the License, or
#    (at your option) any later version.
#
#    This program is distributed in the hope that it will be useful,
#    but WITHOUT ANY WARRANTY; without even the implied warranty of
#    MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the
#    GNU Affero General Public License for more details.
#
#    You should have received a copy of the GNU Affero General Public License
#    along with this program.  If not, see <https://www.gnu.org/licenses/>.
#
#
#    Author/Maintainer: Konrad Bächler <konrad@diva.exchange>
#

###############################################################################
# Stop
###############################################################################

PROJECT_PATH="$( cd "$( dirname "${BASH_SOURCE[0]}" )" >/dev/null 2>&1 && pwd )/../"
cd ${PROJECT_PATH}

source "${PROJECT_PATH}bin/echos.sh"
source "${PROJECT_PATH}bin/helpers.sh"

############################################################################

bot "Stopping and removing diva services"
running "Stop diva"
npm run stop

running "Stopping and removing i2pd"
sudo docker stop i2pd
sudo docker rm i2pd

running "Stopping iroha testnet"
sudo ${PROJECT_PATH}bin/halt-p2p-testnet.sh

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
# Start
###############################################################################

PROJECT_PATH="$( cd "$( dirname "${BASH_SOURCE[0]}" )" >/dev/null 2>&1 && pwd )/../"
cd ${PROJECT_PATH}

source "${PROJECT_PATH}bin/echos.sh"
source "${PROJECT_PATH}bin/helpers.sh"

############################################################################

bot "Start diva"

running "Start the docker container for I2P"
sudo docker run -p 7070:7070 -p 4444:4444 -p 4445:4445 -d --name i2pd divax/i2p:latest

bot "Starting the Iroha testnet"
sudo ${PROJECT_PATH}bin/start-p2p-testnet.sh

running "Install dependencies"
npm i

running "Start diva"
npm start

running "Opening I2Pd webconsole…"
open http://localhost:7070

running "Open diva interface"
open http://localhost:3911

running "Open API interface"
open http://localhost:3912/

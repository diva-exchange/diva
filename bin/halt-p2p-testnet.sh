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

# -a Export variables
set -a

PROJECT_PATH="$( cd "$( dirname "${BASH_SOURCE[0]}" )" >/dev/null 2>&1 && pwd )/../"
cd ${PROJECT_PATH}

${PROJECT_PATH}bin/halt-iroha-explorer.sh

# used to store temporary data related to running containers
DATA_PATH=${PROJECT_PATH}data/

if [[ ! -f ${DATA_PATH}instance ]]
then
  echo "${DATA_PATH}instance not found"
  exit 1
fi

INSTANCES=$(<${DATA_PATH}instance)
# remove instance file
docker ps >/dev/null && rm -f ${DATA_PATH}instance

docker inspect iroha-node >/dev/null && \
  docker stop iroha-node && \
  docker rm iroha-node

# remove iroha-node volume
docker volume rm iroha-node -f

for (( ID_INSTANCE=1; ID_INSTANCE < ${INSTANCES}; ID_INSTANCE++ ))
do
  docker inspect iroha${ID_INSTANCE} >/dev/null && \
    docker stop iroha${ID_INSTANCE} && \
    docker rm iroha${ID_INSTANCE}

  # remove iroha volume
  docker volume rm iroha${ID_INSTANCE} -f
done

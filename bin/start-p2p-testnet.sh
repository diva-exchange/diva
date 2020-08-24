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

# -e Exit immediately if a simple command exits with a non-zero status
set -e

PROJECT_PATH="$( cd "$( dirname "${BASH_SOURCE[0]}" )" >/dev/null 2>&1 && pwd )/../"
cd ${PROJECT_PATH}

# used to store temporary data related to running containers
DATA_PATH=${PROJECT_PATH}data/
if [[ ! -f ${DATA_PATH}instance ]]
then
  echo 1 >${DATA_PATH}instance
fi

ID_INSTANCE=$(<${DATA_PATH}instance)
#@TODO hard coded upper limit of running instances
if [[ ${ID_INSTANCE} -gt 100 ]]
then
  echo "ERROR: too many instances"
  exit 2
fi

NODE_ENV=${NODE_ENV:-production}
BLOCKCHAIN_NETWORK=${BLOCKCHAIN_NETWORK}
JOIN=${JOIN}

if (test ${JOIN:-"0"} = "0" || test ${BLOCKCHAIN_NETWORK:-"0"} = "0")
then
  BLOCKCHAIN_NETWORK=${BLOCKCHAIN_NETWORK:-tn-`date -u +%s`-${RANDOM}}
  NAME_KEY=${NAME_KEY}
  if (test ${NAME_KEY:-"0"} = "0")
  then
    declare -a member=("testnet-a" "testnet-b" "testnet-c")
  else
    declare -a member=(${NAME_KEY})
  fi
else
  declare -a member=("${BLOCKCHAIN_NETWORK}-`date -u +%s`-${RANDOM}")
fi

######
# Iroha Node (Proxy): config
######
TYPE=${TYPE:-P2P}
STUN=${STUN:-}
SIGNAL=${SIGNAL:-}
PORT_CONTROL=${PORT_CONTROL:-10002}

NAME_VOLUME_IROHA=${NAME_VOLUME_IROHA:-"iroha1"}
TORII=${TORII:-"127.19.1.1:10051"}
CREATOR_ACCOUNT_ID=${CREATOR_ACCOUNT_ID:-"diva@testnet"}

######
# Iroha: config & start
######
IP_IROHA_NODE=`ip -4 addr show docker0 | grep -Po 'inet \K[\d.]+'`
PORT_IROHA_PROXY=${PORT_IROHA_PROXY:-10001}
PORT_CONTROL=${PORT_CONTROL:-10002}

PORT_EXPOSE_POSTGRES=${PORT_EXPOSE_POSTGRES:-10032}
PORT_EXPOSE_IROHA_INTERNAL=${PORT_EXPOSE_IROHA_INTERNAL:-10011}
PORT_EXPOSE_IROHA_TORII=${PORT_EXPOSE_IROHA_TORII:-10051}

# Iroha: start
for NAME_KEY in "${member[@]}"
do
  NAME=iroha${ID_INSTANCE}
  IP_PUBLISHED=127.19.${ID_INSTANCE}.1

  # start the container
  echo "Starting instance ${ID_INSTANCE}; Key: ${NAME_KEY}"
  docker run \
    -d \
    -p ${IP_PUBLISHED}:${PORT_EXPOSE_POSTGRES}:5432 \
    -p ${IP_PUBLISHED}:${PORT_EXPOSE_IROHA_INTERNAL}:10001 \
    -p ${IP_PUBLISHED}:${PORT_EXPOSE_IROHA_TORII}:50051 \
    -v ${NAME}:/opt/iroha \
    --env BLOCKCHAIN_NETWORK=${BLOCKCHAIN_NETWORK} \
    --env NAME_KEY=${NAME_KEY} \
    --env IP_PUBLISHED=${IP_PUBLISHED} \
    --env IP_IROHA_NODE=${IP_IROHA_NODE} \
    --env PORT_CONTROL=${PORT_CONTROL} \
    --env PORT_IROHA_PROXY=${PORT_IROHA_PROXY} \
    --name ${NAME} \
    --network bridge \
    divax/iroha:latest

  echo "Running ${NAME_KEY} on blockchain network ${BLOCKCHAIN_NETWORK}"
  ID_INSTANCE=$((ID_INSTANCE + 1))
  echo ${ID_INSTANCE} >${DATA_PATH}instance
done

# Iroha Node (proxy): start
docker run \
  -d \
  --env NODE_ENV=${NODE_ENV} \
  --env TYPE=${TYPE} \
  --env PORT_NODE=${PORT_IROHA_PROXY} \
  --env PORT_CONTROL=${PORT_CONTROL} \
  --env STUN=${STUN} \
  --env SIGNAL=${SIGNAL} \
  --env TORII=${TORII} \
  --env CREATOR_ACCOUNT_ID=${CREATOR_ACCOUNT_ID} \
  -v iroha-node:/home/node \
  -v ${NAME_VOLUME_IROHA}:/tmp/iroha:ro \
  --name iroha-node \
  --network host \
  divax/iroha-node:latest

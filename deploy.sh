#!/usr/bin/env bash

set -e

NODE_PATH=/var/lib/docker/volumes/${1}/_data/
APP_PATH=${NODE_PATH}app/

if [ $# -eq 0 ] || ! [ -d $APP_PATH ] ; then
  echo "Usage: ./deploy.sh DIVA-CONTAINER-VOLUME"
  echo "  DIVA-CONTAINER-VOLUME must be an existing docker container holding the diva app"
  echo
  echo "Example"
  echo "  ./deploy.sh diva0_node"
  exit 1;
fi

PROJECT_PATH="$( cd "$( dirname "${BASH_SOURCE[0]}" )" >/dev/null 2>&1 && pwd )"
cd $PROJECT_PATH

for pathcomponent in bin model src static view ; do
  rm -R ${APP_PATH}${pathcomponent} \
    && cp -R ${PROJECT_PATH}/app/${pathcomponent} ${APP_PATH}
done

# ecosystem
cp ecosystem.config.js ${NODE_PATH}
# package
cp package*.json ${NODE_PATH}

chown -R 1000:1000 ${NODE_PATH}

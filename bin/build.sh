#!/usr/bin/env bash
#
# Maintainer: konrad@diva.exchange
# License: GPLv3
#

set -e

PROJECT_PATH="$( cd "$( dirname "${BASH_SOURCE[0]}" )" >/dev/null 2>&1 && pwd )"
cd ${PROJECT_PATH}/../

docker build -f Dockerfile --no-cache --force-rm -t divax/diva:latest .

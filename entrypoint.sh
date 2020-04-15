#!/bin/sh
#
# Author/Maintainer: konrad@diva.exchange
#
# Start nodeJS with the diva application.
#
set -e

# optional, bind to the corresponding backends
I2PD_IP=${I2PD_IP:-127.0.0.1}
IROHA_IP=${IROHA_IP:-127.0.0.1}
POSTGRES_IP=${POSTGRES_IP:-127.0.0.1}
DOCKER_HOST_IP=${DOCKER_HOST_IP:-127.0.0.1}

# isolated networking
echo "nameserver 127.0.1.1" > /etc/resolv.conf
/bin/cp -f /dnsmasq.conf /etc/dnsmasq.conf
dnsmasq -a 127.0.1.1 \
  --no-hosts \
  --local-service \
  --address=/iroha.local/${IROHA_IP} \
  --address=/postgres.local/${POSTGRES_IP} \
  --address=/i2pd.local/${I2PD_IP} \
  --address=/docker.host.local/${DOCKER_HOST_IP} \
  --address=/#/127.0.0.1

# install database
su node -c "cd /home/node/ && node -r esm ./app/bin/install-db"

# start applications
su node -c "cd /home/node/ && pm2-runtime start ecosystem.config.js --env production"

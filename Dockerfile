FROM node:lts-slim

LABEL author="Konrad Baechler <konrad@diva.exchange>" \
  maintainer="Konrad Baechler <konrad@diva.exchange>" \
  name="diva" \
  description="Distributed value exchange upholding security, reliability and privacy" \
  url="https://diva.exchange"

COPY package.json /home/node/package.json
COPY ecosystem.config.js /home/node/ecosystem.config.js
COPY network/* /

# Applications
COPY app /home/node/app

# Entrypoint
COPY entrypoint.sh /

ENV NPM_CONFIG_LOGLEVEL warn

RUN rm -R /home/node/app/test \
  && apt-get update \
  && apt-get -y install \
    g++ \
    gcc \
    python \
    make \
    automake \
    sqlite \
    dnsmasq \
    nano \
    procps \
    iputils-ping \
  && cd /home/node/ \
  && npm install node-gyp -g \
  && npm install pm2 -g \
  && npm install --production \
  && chown -R node:node "/home/node" \
  && npm uninstall node-gyp -g \
  && apt-get -y purge \
    g++ \
    gcc \
    make \
    automake \
    python \
  && apt-get -y autoremove \
  && chmod +x /entrypoint.sh

# Create the volume to keep the nodeJS Data
VOLUME [ "/home/node/" ]

# 3900 diva.profile app, 3902 diva.api, 10001 iroha utp-proxy
EXPOSE 3900 3902 10001

ENTRYPOINT ["/entrypoint.sh"]

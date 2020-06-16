FROM node:lts-alpine

LABEL author="Konrad Baechler <konrad@diva.exchange>" \
  maintainer="Konrad Baechler <konrad@diva.exchange>" \
  name="diva" \
  description="Distributed value exchange upholding security, reliability and privacy" \
  url="https://diva.exchange"

COPY package.json /home/node/package.json
COPY ecosystem.config.js /home/node/ecosystem.config.js

# Applications
COPY app /home/node/app

# Entrypoint
COPY entrypoint.sh /

ENV NPM_CONFIG_LOGLEVEL warn

RUN rm -R /home/node/app/test \
  && apk --no-cache --virtual build-dependendencies add \
    make \
    gcc \
    g++ \
    libtool \
    binutils \
    build-base \
    autoconf \
    automake \
    python3 \
  && cd /home/node/ \
  && npm install node-gyp -g \
  && npm install pm2 -g \
  && apk --no-cache add \
    sqlite \
# install the application
  && npm install --production \
  && chown -R node:node "/home/node" \
  && npm uninstall node-gyp -g \
  && apk --no-cache --purge del build-dependendencies \
  && chmod +x /entrypoint.sh

# Create the volume to keep the nodeJS Data
VOLUME [ "/home/node/" ]

# 3901 divaapp, 3902 diva.api
EXPOSE 3901 3902

ENTRYPOINT ["/entrypoint.sh"]

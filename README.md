# diva.exchange

Distributed value exchange upholding security, reliability and privacy.

_Diva_ is an application (free software, AGPLv3). It enables everyone to manage and trade digital values (like crypto currencies). Every installation of _diva_ (like on your laptop) is your personal and private bank and exchange. There is no dependency to any cloud or other central service. _Diva_ includes all necessary services locally. Therefore a complete _diva_ installation consists of several parts:
* an instance of the "Hyperledger/Iroha" Blockchain
* the private and secure communication network "I2P" (aka "darknet")
* the _diva_ application

There are two flavours of _diva_ available: a light version (without blockchain instance) and a full version (everything).

## About

This is a research project driven by a small community of researchers which are highly motivated by exploring and understanding the unknown. Respect the AGPLv3 license terms!

![alt text](https://social.diva.exchange/system/site_uploads/files/000/000/001/original/social-diva-background-1200-630.png)

## How to get in touch

You can get in touch using the features on this platform, via Issues or Pull Requests, or you can use one of those channels: 
* Web: [https://diva.exchange]()
* Mastodon (like Twitter, just smarter): [https://social.diva.exchange]()
* Telegram: [https://t.me/diva_exchange_chat_de]()

Please contact us in English or German.

## Beware of Dragons

This project is unstable and highly experimental. Feedback and pull requests are always welcome!

## Get Started - Local Installation

To get _diva_ up and running, achieve this:
1. Fetch the code from the repository
2. Start the Docker containers

Please read on to get that done!

Currently _diva_ uses Docker. Docker is just a "Container Framework" helping you to install "something else" on your existing system (like your laptop) without interfering with your existing environment. Docker works on Linux, MacOS and Windows.

Get a short overview of Docker here: [https://docs.docker.com/get-started/](). Just read the short introduction to get the point (first two paragraphs).

### How to Install Docker and Docker Compose

Install Docker and Docker Compose before you install _diva_.

#### Windows

Docker: [https://docs.docker.com/docker-for-windows/install/]()

Docker Compose: [https://docs.docker.com/compose/install/]()

#### MacOS

Docker: [https://docs.docker.com/docker-for-mac/install/]()

Docker Compose: [https://docs.docker.com/compose/install/]()

#### Linux

Usually just something like: `sudo apt-get install docker.io`
More details, Ubuntu flavours: [https://docs.docker.com/install/linux/docker-ce/ubuntu/]()

Docker Compose: [https://docs.docker.com/compose/install/]()

### How to Install diva

Have you installed Docker? If not, please do so first (see above).

Now get the diva repository via clone _or_ download:

* clone the diva repository: `git clone --branch develop https://codeberg.org/diva.exchange/diva.git ~/diva.exchange/diva`

_or_

* [download](https://codeberg.org/diva.exchange/diva/archive/develop.zip) and unpack the code repository to your local device. 

   We assume that you store the downloaded repository within your User folder, which is usually located here:

   * **Windows**: C:\Users\YourUsername\
   * **MacOS**: /Users/YourUsername/
   * **Linux/Ubuntu flavour**: /home/YourUsername/

   We assume as well, that you **create a folder called "diva.exchange" within your User folder** where you unpack the DIVA repository.

Then, from the project folder and using your terminal:

> ⚠️ Please note: Installation will purge your existing local testnet.

1. Install the project by running: `./bin/install.sh`. During the installation process, you will be asked for for the password of the privileged user, since `sudo` gets used to access docker.
2. Then start it by running: `./bin/start.sh`. During the start-up process, you will be asked for for the password of the privileged user, since `sudo` gets used to access docker.


Test it: `sudo docker ps -a` should show quite some running container, something like:

```
diva $ sudo docker ps
IMAGE                         COMMAND                  NAMES
divax/iroha-explorer:latest   "/entrypoint.sh"         explorer.testnet.diva.local
divax/iroha:latest            "/entrypoint.sh"         n4.testnet.diva.local
postgres:10-alpine            "docker-entrypoint.s…"   n3.db.testnet.diva.local
postgres:10-alpine            "docker-entrypoint.s…"   n1.db.testnet.diva.local
postgres:10-alpine            "docker-entrypoint.s…"   n5.db.testnet.diva.local
postgres:10-alpine            "docker-entrypoint.s…"   n6.db.testnet.diva.local
divax/iroha:latest            "/entrypoint.sh"         n2.testnet.diva.local
divax/iroha:latest            "/entrypoint.sh"         n5.testnet.diva.local
divax/iroha:latest            "/entrypoint.sh"         n1.testnet.diva.local
divax/iroha:latest            "/entrypoint.sh"         n6.testnet.diva.local
divax/iroha:latest            "/entrypoint.sh"         n7.testnet.diva.local
postgres:10-alpine            "docker-entrypoint.s…"   n2.db.testnet.diva.local
postgres:10-alpine            "docker-entrypoint.s…"   n7.db.testnet.diva.local
divax/diva-api:latest         "/entrypoint.sh"         api.testnet.diva.local
postgres:10-alpine            "docker-entrypoint.s…"   n4.db.testnet.diva.local
divax/iroha:latest            "/entrypoint.sh"         n3.testnet.diva.local
```

DIVA is available locally:
running on on [http://localhost:3911](). Open in up in a browser and you'll see the application. Remember: using this setup, nothing related to DIVA will ever leave your local box.

Test the local DIVA Blockchain Explorer: [http://172.29.101.100:3920/]().

> ⚠️ Please note: your using a development branch. There might be dragons.

### How to Stop and Remove DIVA

To stop DIVA, press Ctrl-C within the console where `bin/start.sh` is running.

Stop the testnet: `sudo docker-compose -f docker-compose/local-testnet.yml down`

To stop the testnet and remove all local testnet data (purge the docker volumes): `sudo docker-compose -f docker-compose/local-testnet.yml down --volumes`

### How to Build the Docker Images

#### Windows

tbd.

#### Linux and MacOS

tbd.

### First Glance at I2P

@TODO THIS IS WORK IN PROGRESS. Out-of-date on the development branch. 

Use the i2pd web-console to explore the i2pd router running within the docker container i2pd. To access the webconsole, open your browser and navigate to http://localhost:7070. 

I2P needs some time to get properly integrated in the network. Please be patient for at least 3 minutes.

To access the I2P network just set the HTTP proxy of your favourite browser (Firefox, see: [https://support.mozilla.org/en-US/kb/connection-settings-firefox]()) to [localhost:4444](http://localhost:4444). Depending on your browser your mileage may vary.

After changing the HTTP proxy, your chosen browser will be connected to the I2P network and you can navigate to http://diva.i2p or any other I2P site of your choice.

Interesting blog post: "Introduction to I2P", [https://www.diva.exchange/en/privacy/introduction-to-i2p-your-own-internet-secure-private-and-free/]()


### Contact the Developers

On [DIVA.EXCHANGE](https://www.diva.exchange) you'll find various options to get in touch with the team. 

Talk to us via Telegram [https://t.me/diva_exchange_chat_de]() (English or German).

### Donations

Your donation goes entirely to the project. Your donation makes the development of DIVA.EXCHANGE faster.

XMR: 42QLvHvkc9bahHadQfEzuJJx4ZHnGhQzBXa8C9H3c472diEvVRzevwpN7VAUpCPePCiDhehH4BAWh8kYicoSxpusMmhfwgx

BTC: 3Ebuzhsbs6DrUQuwvMu722LhD8cNfhG1gs

Awesome, thank you!

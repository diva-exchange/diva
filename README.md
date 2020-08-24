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

* clone the diva repository: `git clone https://codeberg.org/diva.exchange/diva.git ~/diva.exchange/diva`

_or_

* [download](https://codeberg.org/diva.exchange/diva/archive/master.zip) and unpack the code repository to your local device. 

   We assume that you store the downloaded repository within your User folder, which is usually located here:

   * **Windows**: C:\Users\YourUsername\
   * **MacOS**: /Users/YourUsername/
   * **Linux/Ubuntu flavour**: /home/YourUsername/

   We assume as well, that you **create a folder called "diva.exchange" within your User folder** where you unpack the DIVA repository.

Then, from the project folder and using your terminal:

1. Install the project by running: `./bin/install.sh`. During the installation process, you will be asked for for the password of the privileged user, since `sudo` gets used to access docker.
2. Then start it by running: `./bin/start.sh`. During the start-up process, you will be asked for for the password of the privileged user, since `sudo` gets used to access docker.


Test it, as privileged user: `docker ps -a` should show a running **i2pd** container, three **iroha** containers (that's the so called DIVA testnet) and a iroha-node container, like this:

```
diva $ sudo docker ps
IMAGE                     COMMAND                  CREATED             STATUS              PORTS                                                                                  NAMES
divax/iroha-node:latest   "/entrypoint.sh"         21 seconds ago      Up 19 seconds                                                                                              iroha-node
divax/iroha:latest        "/entrypoint.sh"         21 seconds ago      Up 21 seconds       127.19.3.1:10032->5432/tcp, 127.19.3.1:10011->10001/tcp, 127.19.3.1:10051->50051/tcp   iroha3
divax/iroha:latest        "/entrypoint.sh"         22 seconds ago      Up 21 seconds       127.19.2.1:10032->5432/tcp, 127.19.2.1:10011->10001/tcp, 127.19.2.1:10051->50051/tcp   iroha2
divax/iroha:latest        "/entrypoint.sh"         23 seconds ago      Up 22 seconds       127.19.1.1:10032->5432/tcp, 127.19.1.1:10011->10001/tcp, 127.19.1.1:10051->50051/tcp   iroha1
divax/i2p:latest          "/home/i2pd/entrypoi…"   24 seconds ago      Up 23 seconds       0.0.0.0:4444-4445->4444-4445/tcp, 0.0.0.0:7070->7070/tcp                               i2pd

```

Take a close look at your running NodeJS processes using the process manager pm2:

```
diva $ pm2 status
┌─────┬─────────────┬─────────────┬─────────┬─────────┬──────────┬────────┬──────┬───────────┬──────────┬──────────┬──────────┬──────────┐
│ id  │ name        │ namespace   │ version │ mode    │ pid      │ uptime │ ↺    │ status    │ cpu      │ mem      │ user     │ watching │
├─────┼─────────────┼─────────────┼─────────┼─────────┼──────────┼────────┼──────┼───────────┼──────────┼──────────┼──────────┼──────────┤
│ 0   │ diva        │ default     │ 0.1.0   │ fork    │ 7717     │ 15m    │ 0    │ online    │ 0.9%     │ 85.3mb   │ diva     │ disabled │
│ 1   │ diva.api    │ default     │ 0.1.0   │ fork    │ 7724     │ 15m    │ 0    │ online    │ 0.5%     │ 86.0mb   │ diva     │ disabled │
└─────┴─────────────┴─────────────┴─────────┴─────────┴──────────┴────────┴──────┴───────────┴──────────┴──────────┴──────────┴──────────┘
```

Hence there should be two services available locally: the application DIVA and the API.
- DIVA application now runs on on [http://localhost:3911](). Open in up in a browser and create your *local* account. Remember: using this setup, nothing related to DIVA will ever leave your local box.
- The API is boring but super important. You can access it using your browser, http://localhost:3912.

Also, test I2PD it with your browser: [http://localhost:7070]() - you should see the I2Pd webconsole. I2P is up and running.

> ⚠️ Please note: your using a development branch. There might be dragons.

### How to Stop and Remove DIVA

To stop and remove DIVA from your local box:

`./bin/stop.sh`

### How to Build the Docker Images

#### Windows

tbd.

#### Linux and MacOS

tbd.

### First Glance at I2P

Use the i2pd web-console to explore the i2pd router running within the docker container i2pd. To access the webconsole, open your browser and navigate to http://localhost:7070. 

I2P needs some time to get properly integrated in the network. Please be patient for at least 3 minutes.

To access the I2P network just set the HTTP proxy of your favourite browser (Firefox, see: [https://support.mozilla.org/en-US/kb/connection-settings-firefox]()) to [localhost:4444](http://localshost:4444). Depending on your browser your mileage may vary.

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

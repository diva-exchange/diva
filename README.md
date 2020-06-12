# diva.exchange

Distributed value exchange upholding security, reliability and privacy.

_Diva_ is an application (free software, GPLv3). It enables everyone to manage and trade digital values (like crypto currencies). Every installation of _diva_ (like on your laptop) is your personal and private bank and exchange. There is no dependency to any cloud or other central service. _Diva_ includes all necessary services locally. Therefore a complete _diva_ installation consists of several parts:
* an instance of the "Hyperledger/Iroha" Blockchain
* the private and secure communication network "I2P" (aka "darknet")
* the _diva_ application

There are two flavours of _diva_ available: a light version (without blockchain instance) and a full version (everything).

## About
This is a research project driven by a small community of researchers which are highly motivated by exploring and understanding the unknown. Respect the GPLv3 license terms!

![alt text](https://social.diva.exchange/system/site_uploads/files/000/000/001/original/social-diva-background-1200-630.png)

## How to get in touch
You can get in touch using the features on this platform, via Issues or Pull Requests, or you can use one of those channels: 
* Web: https://diva.exchange
* Mastodon (like Twitter, just smarter): https://social.diva.exchange
* Telegram: https://t.me/diva_exchange_chat_de

Please contact us in English or German.

## Beware of Dragons
This project is unstable and highly experimental. Feedback and pull requests are always welcome!

## Get Started - Local Installation

To get _diva_ up and running, achieve this:
1. Install Docker and Docker Compose
2. Pull the _diva_ repositories from codeberg
3. Build the Docker images within your local environment
4. Start the Docker containers

Please read on to get that done!

Currently _diva_ requires Docker. Docker is just a "Container Framework" helping you to install "something else" on your existing system (like your laptop) without interfering with your existing environment. Docker works on Linux, MacOS and Windows.

Get a short overview of Docker here: https://docs.docker.com/get-started/. Just read the short introduction to get the point (first two paragraphs).

### How to Install Docker and Docker Compose

Install Docker and Docker Compose before you install _diva_.

#### Windows
Docker: https://docs.docker.com/docker-for-windows/install/

Docker Compose: https://docs.docker.com/compose/install/

#### MacOS
Docker: https://docs.docker.com/docker-for-mac/install/

Docker Compose: https://docs.docker.com/compose/install/

#### Linux
Usually just something like: `sudo apt-get install docker.io`
More details, Ubuntu flavours: https://docs.docker.com/install/linux/docker-ce/ubuntu/ 

Docker Compose: https://docs.docker.com/compose/install/

### How to Install diva

Have you installed Docker? If not, please do so first (see above).

Now download the necessary code repositories to your local device. We assume that you store downloaded repositories within your User folder, which is usually located here:

* **Windows**: C:\Users\YourUsername\
* **MacOS**: /Users/YourUsername/
* **Linux/Ubuntu flavour**: /home/YourUsername/

Now, we assume you **create a folder called "diva.exchange" within your User folder** and you download and unpack the DIVA repository into this newly created folder:

1. DIVA repository: https://codeberg.org/diva.exchange/diva/archive/master.zip
2. Pull the Docker Image for I2P: `docker pull divax/i2p:latest`
3. Pull the Docker Image for Iroha: `docker pull divax/iroha`

Start the docker container for I2P:
1. As priviledged user: `docker run -p 7070:7070 -p 4444:4444 -p 4445:4445 -d --name i2pd divax/i2p:latest`
2. Test it: `sudo docker ps -a` should show a running i2pd container. Also test it with your browser: http://localhost:7070 - you should see the I2Pd webconsole. I2P is up and running.

Start the docker container for Iroha (needs a persistant storage):
1. Create the volume, as priviledged user: `docker volume create iroha`
2. Start the container, as priviledged user: `docker run -d -p 25432:5432 -p 50151:50051 --name=iroha --mount type=volume,src=iroha,dst=/opt/iroha/data/ divax/iroha:latest`
3. Test it, as priviledged user: `docker ps -a` should show a running iroha container.

Start diva:
1. Navigate to your diva folder, like /home/YourUsername/diva.exchange/ or /Users/YourUsername/diva.exchange/
2. PM2 process manager is required: `npm install -g pm2`
3. Install the diva database: `npm run install`
4. Start diva: `npm start`
4. You have now two services available locally: the application DIVA and the API. The application on http://localhost:3911 (this is DIVA - all you do happens locally - no data transferred over the network). The API is boring but super important. You can access it using your browser, http://localhost:3912.
5. Please note: your using a development branch. There might be dragons.

### How to Stop and Clean Up
Stop and completely remove the docker container. All data within the containers (like the blockchain) will be lost - that's fine if you want to have a fresh start.

Navigate to your diva folder and execute: `npm stop`

`sudo docker stop i2pd iroha`

`sudo docker rm i2pd iroha`

Now remove all data:

`sudo docker volume rm iroha`

To clean up your system (optional - you know what you are doing):

`sudo docker volume prune`

`sudo docker system prune`


### How to Build the Docker Images

#### Windows
tbd.

#### Linux and MacOS
tbd.

### How to Start diva

#### Windows
tbd.

#### Linux and MacOS
tbd.

### How to Stop diva

#### Windows
tbd.

#### Linux and MacOS
tbd.

### First Glance at I2P

Use the i2pd webconsole to explore the i2pd router running within the docker container i2pd. To access the webconsole, open your browser and navigate to http://localhost:7070. 

I2P needs some time to get properly integrated in the network. Please be patient for at least 3 minutes.

To access the I2P network just set the HTTP proxy of your favourite browser (Firefox, see: https://support.mozilla.org/en-US/kb/connection-settings-firefox) to localhost:4444. Depending on your browser your mileage may vary.

After changing the HTTP proxy, your chosen browser will be connected to the I2P network and you can navigate to http://diva.i2p or any other I2P site of your choice.

Interesting blog post: "Introduction to I2P", https://www.diva.exchange/en/privacy/introduction-to-i2p-your-own-internet-secure-private-and-free/


### Contact the Developers

Talk to us via Telegram https://t.me/diva_exchange_chat_de (English or German).

### Donations

Your donation goes entirely to the project. Your donation makes the development of DIVA.EXCHANGE faster.

XMR: 42QLvHvkc9bahHadQfEzuJJx4ZHnGhQzBXa8C9H3c472diEvVRzevwpN7VAUpCPePCiDhehH4BAWh8kYicoSxpusMmhfwgx

BTC: 3Ebuzhsbs6DrUQuwvMu722LhD8cNfhG1gs

Awesome, thank you!

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

To get _diva_ up and running simply achieve this:
1. Install Docker and Docker Compose
2. Pull the _diva_ repositories from gitlab
3. Build the Docker images within your local environment
4. Start the Docker containers

Just read on to get that done!

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

Now, we assume you **create a folder called "diva.exchange" within your User folder** and you download and unpack four repositories into this newly created folder:

1. https://gitlab.com/diva.exchange/diva/-/archive/master/diva-master.zip
2. https://gitlab.com/diva.exchange/i2pd/-/archive/master/i2pd-master.zip
3. https://gitlab.com/diva.exchange/iroha/-/archive/master/iroha-master.zip
4. https://gitlab.com/diva.exchange/hangout/-/archive/master/hangout-master.zip

Unpack the four archives into your diva.exchange folder. Rename the three folders by removing the "-master" postfix. After unpacking and renaming, your folder structure will look like this on **Windows**:
* C:\Users\YourUsername\diva.exchange\diva\
* C:\Users\YourUsername\diva.exchange\i2pd\
* C:\Users\YourUsername\diva.exchange\iroha\
* C:\Users\YourUsername\diva.exchange\hangout\

On **MacOS**:
* /Users/YourUsername/diva.exchange/diva/
* /Users/YourUsername/diva.exchange/i2pd/
* /Users/YourUsername/diva.exchange/iroha/
* /Users/YourUsername/diva.exchange/hangout/

On **Linux**:
* /home/YourUsername/diva.exchange/diva/
* /home/YourUsername/diva.exchange/i2pd/
* /home/YourUsername/diva.exchange/iroha/
* /home/YourUsername/diva.exchange/hangout/

### How to Build the Docker Images

#### Windows
tbd.

#### Linux
After downloading the code, docker images have to be built. Simply navigate to `diva.exchange/iroha` and execute `build.sh`. This shell script will build all necessary docker images. 

### How to Start diva

#### Windows
tbd.

#### Linux and MacOS
Navigate to your `diva.exchange/iroha/` folder and execute the shell script `./up.sh 1`. This will start a single instance of the _diva_ stack. Use `docker ps -a` to explore the running containers. You will see five running containers: diva0, db0, iroha0, i2pd0 and hangout. 

To start multiple instances of the _diva_ stack, increase the number of instances passed to `./up.sh`. To start three instances of the _diva_ stack use `./up.sh 3`. 

### How to Stop diva

#### Windows
tbd.

#### Linux and MacOS
Navigate to your `diva.exchange/iroha/` folder and execute the shell script `./down.sh 1`. This will stop a single instance of the _diva_ stack. Use `./down.sh 3` to stop three running instances of the _diva_ stack. 

### First Glance at I2P
Use the i2pd webconsole to explore the i2pd router running within the docker container i2pd0. To access the webconsole, open your browser and navigate to http://localhost:7070. If you have multiple instances of the _diva_ stack running, use the corresponding port numbers: container i2pd0 runs on port 7070, i2pd1 runs on port 7071, i2pd2 runs on port 7072 etc.

I2P needs some time to get properly integrated in the network. Please be patient for at least 3 minutes.

To access the I2P network just set the HTTP proxy of your favourite browser (Firefox, see: https://support.mozilla.org/en-US/kb/connection-settings-firefox) to localhost:4440. Depending on your browser your mileage may vary.

After changing the HTTP proxy, your chosen browser will be connected to the I2P network and you can navigate to http://diva.i2p or any other I2P site of your choice.


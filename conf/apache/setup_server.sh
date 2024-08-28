#!/bin/bash

sudo git config --global --add safe.directory /home/pi/ppipelin.github.io
sudo git submodule update --init --recursive
sudo chown -R www-data:www-data /home/pi/ppipelin.github.io
sudo chmod -R 777 /home/pi/ppipelin.github.io
sudo apt-get update -y && sudo apt-get upgrade -y
sudo apt-get install -y apache2 openssl
sudo cp /etc/apache2/apache2.conf /etc/apache2/apache2.conf.old && sudo cp /etc/apache2/sites-available/000-default.conf /etc/apache2/sites-available/000-default.conf.old
sudo cp conf/apache/apache2.conf /etc/apache2/apache2.conf && sudo cp ./conf/apache/sites-available/000-default.conf /etc/apache2/sites-available/000-default.conf # copy local to folder
sudo a2enmod rewrite
sudo a2enmod ssl
sudo service apache2 restart

# Port forward 80 and 443

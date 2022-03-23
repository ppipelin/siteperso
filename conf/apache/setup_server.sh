sudo apt-get install -y apache2 openssl
sudo cp /etc/apache2/apache2.conf /etc/apache2/apache2.conf.old && sudo cp /etc/apache2/sites-available/000-default.conf /etc/apache2/sites-available/000-default.conf.old
sudo cp ./apache2.conf /etc/apache2/apache2.conf && sudo cp ./sites-available/000-default.conf /etc/apache2/sites-available/000-default.conf # copy local to folder
sudo a2enmod rewrite
sudo a2enmod ssl
sudo service apache2 restart

# Port forward 80 and 443

!/usr/bin/env bash

if [ "$#" -ne 2 ]; then
  echo "Usage: $0 address subdomain" >&2
  exit 1
fi

ssh $1  'bash -s' <<EOF
echo "Updating"
sudo apt-get update >/dev/null 2>&1
sudo apt-get upgrade -y >/dev/null 2>&1

echo "Installing nodejs"
curl -sL https://deb.nodesource.com/setup_10.x | sudo -E bash -
sudo apt-get install -y nodejs >/dev/null 2>&1
echo "nginx"
sudo apt-get install nginx -y  >/dev/null 2>&1
echo "PM2"
npm install -g pm2@latest /dev/null  2>&1
EOF


echo "SFTP"
sftp $1 >/dev/null 2>&1 <<EOF
put ecosystem.config.js
mkdir awesomefiles
cd awesomefiles
mkdir nodePrint
mkdir install
cd nodePrint
lcd ../nodePrint
mkdir public
put *
put -r public

cd ../install
lcd ../install
put cors 
put default
exit
EOF

ssh $1  'bash -s' <<EOF
echo "Upload Complete"
echo "Setting up nodePrint"
sudo mv awesomefiles/install/cors /etc/nginx >/dev/null 2>&1
sudo mv awesomefiles/install/default /etc/nginx/sites-available >/dev/null 2>&1
cd awesomefiles/nodePrint >/dev/null 2>&1
mkdir PDF >/dev/null 2>&1
npm install >/dev/null 2>&1
sudo apt-get install -y libpangocairo-1.0-0 libx11-xcb1 libxcomposite1 libxcursor1 libxdamage1 libxi6 libxtst6 libnss3 libcups2 libxss1 libxrandr2 libgconf2-4 libasound2 libatk1.0-0 libgtk-3-0 >/dev/null 2>&1

cd ~ >/dev/null 2>&1
pm2 start ecosystem.config.js --watch >/dev/null 2>&1
pm2 save >/dev/null 2>&1

sudo pm2 startup | sed -e 's/.*sudo//' >/dev/null 2>&1

sudo apt-get install software-properties-common >/dev/null 2>&1
sudo add-apt-repository ppa:certbot/certbot >/dev/null 2>&1
sudo apt-get update >/dev/null 2>&1
sudo apt-get install python-certbot-nginx >/dev/null 2>&1

echo "LetsEncrypt for $2.libretexts.org"
sudo certbot --nginx -d $2.libretexts.org  >/dev/null 2>&1
libretextspdf@gmail.com
A
2

EOF

ssh $1  'bash -s' <<EOF
sudo sed -i 's/dynamic/$2/g' /etc/nginx/sites-available/default  >/dev/null 2>&1
sudo systemctl reload nginx
echo "Installed Successfully!"
date "+%D %r"
EOF
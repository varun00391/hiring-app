##### Manual way ##########

1. created VM on azure manually.
2. download vm key (.pem) in local & put it inside project folder.
3. Get public IP from azure portal (20.197.44.101)
4. Run below command in local system to connect azure vm to local:
   - ssh -i vm1_key.pem azureuser@vm_public_ip

5. update server:
   - sudo apt update && sudo apt upgrade -y
6. Install git
   - sudo apt install git -y

7. - sudo apt install docker.io docker-compose-v2 -y
   - sudo systemctl enable docker
   - sudo systemctl start docker
   - sudo usermod -aG docker $USER

   logout using exit; then login again:
   - ssh -i vm1_key.pem azureuser@vm_public_ip

   - docker --version
   - docker compose version

8. Then git clone the repo if its first time else do git pull for pulling latest code from repo

9. Then go inside the folder & Then starting docker with docker compose up -d or docker compose build --no-cache & then docker compose up -d

##### Manual way ##########

1. created VM on azure manually.
2. download vm key (.pem) in local & put it inside project folder.
3. Get public IP from azure portal (20.197.44.101)
4. Run below command in local system to connect azure vm to local:
   - ssh -i vm1_key.pem azureuser@20.197.44.101

5. update server:
   - sudo apt update && sudo apt upgrade -y
6. Install git
   - sudo apt install git -y

7. Install docker + Compose **v2** (avoid `docker-compose` v1 from apt — it can crash with `KeyError: 'id'` when tailing logs on current Docker engines)
   - If you already installed the old client: `sudo apt remove docker-compose -y` (optional)
   - sudo apt install docker.io docker-compose-v2 -y
   - sudo systemctl enable docker
   - sudo systemctl start docker
   Add user to Docker group , then logout/login again
   - sudo usermod -aG docker $USER ; use exit for logout 
   & then again login using ssh -i vm1_key.pem azureuser@20.197.44.101

   - docker --version
   - docker compose version ##

   Use **`docker compose`** (space) to run the stack, e.g. after cloning the repo:

   **Public IP / login fix (required unless you only use localhost):** The browser loads JS that calls the API URL baked into the **frontend image**. Defaults use `localhost`, which breaks login from another machine. In the repo directory on the VM:

   - `cp .env.example .env` and edit `.env`: set `CORS_ORIGINS` and `NEXT_PUBLIC_API_URL` to your VM URLs, e.g. `http://YOUR_PUBLIC_IP:3000` and `http://YOUR_PUBLIC_IP:8000/api/v1` (same scheme/host as users type in the address bar).
   - Rebuild frontend so the new API URL is embedded: `docker compose build --no-cache frontend` then `docker compose up -d` (or add `--build`).
   - Seeded admin: `admin@gmail.com` / `admin123` (with `UNIFY_DEMO_PASSWORDS=true` in compose).

   - `docker compose logs -f`  # follow logs (optional)

8. Install & start nginx 
   - sudo apt install nginx -y
   - sudo systemctl start nginx
   - sudo systemctl enable nginx

   # check nginx
   http://YOUR_VM_IP [Open Browser it will show Nginx welcome message]

9. Configure Firewall
   - On Azure **Portal**, add **NSG inbound** rules for ports you use (e.g. 3000 and 8000) in addition to UFW on the VM.
   - sudo ufw allow OpenSSH
   - sudo ufw allow 80
   - sudo ufw allow 443
   - sudo ufw allow 3000 (frontend)
   - sudo ufw allow 8000 (backend)  # do not expose database publicly; keep it private

   - sudo ufw enable
   - sudo ufw status
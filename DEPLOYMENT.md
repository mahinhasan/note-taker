# Deploying to a VPS with MongoDB Atlas (free tier)

```
Internet ──HTTPS──▶ Nginx :443 ──▶ Node/Express :4000 ──TLS──▶ MongoDB Atlas M0 (free, 512 MB)
            (VPS)                  (API + built React app)          (cloud)
```

- **MongoDB Atlas M0** is MongoDB's free-forever cluster: 512 MB of storage and no card required. Nothing database-related has to be installed on the VPS.
- **Nginx** handles HTTPS and forwards requests to the Node app.
- **Express** serves the API (`/api/...`) and the built React frontend from the same domain.
- **systemd** keeps the app running and restarts it after a crash or reboot.

Throughout this guide, replace:

| Placeholder | Example |
|---|---|
| `YOUR_VPS_IP` | `203.0.113.10` |
| `notes.yourdomain.com` | `notes.isotokuhr.com` |

---

## 0. Push the latest code (on your computer)

The VPS clones the project from GitHub:

```bash
cd ~/Desktop/task/CareGuide
git add .
git commit -m "Serve built frontend from Express, add deployment guide"
git push origin main
```

## 1. Create the free MongoDB Atlas database

1. Sign up at https://www.mongodb.com/cloud/atlas/register. Google login works.
2. **Create a cluster**:
   - Plan: **M0 (Free)**.
   - Provider: **AWS**.
   - Region: the one closest to your VPS. For a VPS in India, that's **Mumbai (ap-south-1)**.
   - Name: `careguide`. Click **Create Deployment**.
3. **Database Access → Add New Database User**:
   - Username: `careguide_app`.
   - Password: **Autogenerate Secure Password**. It uses only letters and numbers, so it is safe in a connection string. **Save it.**
   - Built-in role: **Read and write to any database**.
4. **Network Access → Add IP Address**:
   - `YOUR_VPS_IP`, with comment `VPS`.
   - **Add Current IP Address**, with comment `My PC`. You need this only if you run commands against Atlas from your computer.
5. **Database → Connect → Drivers** gives you the connection string:

   ```
   mongodb+srv://careguide_app:<db_password>@careguide.xxxxx.mongodb.net/?retryWrites=true&w=majority&appName=careguide
   ```

   Make two edits:
   - Replace `<db_password>` with the password.
   - Put the database name `careguide` right after `.mongodb.net/`:

   ```
   mongodb+srv://careguide_app:PASSWORD@careguide.xxxxx.mongodb.net/careguide?retryWrites=true&w=majority&appName=careguide
   ```

Atlas M0 runs MongoDB 8.x, so both aggregations work, including the `$lookup` with `localField`/`foreignField` and a `pipeline`.

## 2. Point the domain at the VPS

In hPanel go to **Domains → isotokuhr.com → DNS records** and add:

| Type | Name | Points to | TTL |
|---|---|---|---|
| A | `notes` | `YOUR_VPS_IP` | 3600 |

This is needed only from step 8 on. DNS takes a few minutes to an hour to update.

## 3. Basic server setup

```bash
ssh root@YOUR_VPS_IP
```

```bash
apt update && apt upgrade -y
apt install -y git curl ufw nginx

adduser --disabled-password --gecos "" deploy
usermod -aG sudo deploy
passwd deploy

ufw allow OpenSSH
ufw allow 'Nginx Full'
ufw --force enable
```

- **`deploy` user**: the app runs as this normal user, not as root.
- **Firewall**: only SSH (22), HTTP (80) and HTTPS (443) are open. Port 4000 stays closed to the internet.
- **Atlas traffic**: the app connects out to Atlas, and outgoing connections are not blocked.

## 4. Install Node.js 22

```bash
curl -fsSL https://deb.nodesource.com/setup_22.x | bash -
apt install -y nodejs
node -v
```

`node -v` should print `v22.x`.

## 5. Get the code and build it

```bash
su - deploy
git clone https://github.com/mahinhasan/note-taker.git
cd note-taker
npm run build
```

`npm run build` installs the backend's production dependencies, then installs and builds the frontend into `frontend/dist`. Express serves that folder.

If the repository is **private**, use one of these:
- a GitHub personal access token as the password, or
- a deploy key: run `ssh-keygen -t ed25519`, add `~/.ssh/id_ed25519.pub` in **GitHub → repo → Settings → Deploy keys**, and clone with `git@github.com:mahinhasan/note-taker.git`.

## 6. Configure the backend

Still as `deploy`, in `~/note-taker`:

```bash
JWT=$(node -e "console.log(require('crypto').randomBytes(48).toString('hex'))")
cat > backend/.env <<EOF
NODE_ENV=production
PORT=4000
MONGODB_URI=PASTE_ATLAS_CONNECTION_STRING_HERE
JWT_SECRET=$JWT
TRUST_PROXY=1
LOGIN_RATE_WINDOW_MS=900000
LOGIN_RATE_MAX=10
EOF
chmod 600 backend/.env
nano backend/.env
```

In `nano`, replace `PASTE_ATLAS_CONNECTION_STRING_HERE` with the full string from step 1.5. Save with **Ctrl+O, Enter**, then exit with **Ctrl+X**.

- **`TRUST_PROXY=1`**: required because Nginx sits in front. Without it, the login rate limiter sees every visitor as the same IP.
- **`chmod 600`**: only the `deploy` user can read the secrets.

### 6.1 Create the first admin and the indexes

```bash
cd ~/note-taker/backend
ADMIN_EMAIL='you@isotokuhr.com' ADMIN_PASSWORD='a-long-unique-password' ADMIN_NAME='Your Name' npm run seed
npm run explain
cd ~
```

- **The seed** creates the admin account. Use a strong password, not `change-me-please`.
- **`npm run explain`** creates the 4 indexes on Atlas and should end with `20/20 queries avoid COLLSCAN.`
- **Connection timeout**: the VPS IP is missing from Atlas Network Access (step 1.4).

## 7. Run the app as a service

Go back to root with `exit`, then:

```bash
cat > /etc/systemd/system/careguide.service <<'EOF'
[Unit]
Description=Care Guide notes app
After=network-online.target
Wants=network-online.target

[Service]
Type=simple
User=deploy
WorkingDirectory=/home/deploy/note-taker
ExecStart=/usr/bin/node backend/src/server.js
Restart=on-failure
RestartSec=5
Environment=NODE_ENV=production

[Install]
WantedBy=multi-user.target
EOF

systemctl daemon-reload
systemctl enable --now careguide
systemctl status careguide --no-pager
curl -s http://127.0.0.1:4000/api/health
```

The last command should print `{"status":"ok"}`. To follow the logs live, run `journalctl -u careguide -f`.

## 8. Nginx and HTTPS

```bash
cat > /etc/nginx/sites-available/careguide <<'EOF'
server {
    listen 80;
    listen [::]:80;
    server_name notes.yourdomain.com;

    client_max_body_size 1m;

    location / {
        proxy_pass http://127.0.0.1:4000;
        proxy_http_version 1.1;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
    }
}
EOF

nano /etc/nginx/sites-available/careguide
ln -s /etc/nginx/sites-available/careguide /etc/nginx/sites-enabled/
rm -f /etc/nginx/sites-enabled/default
nginx -t && systemctl reload nginx
```

In `nano`, set `server_name` to your real domain.

Once `dig +short notes.yourdomain.com` prints `YOUR_VPS_IP`, add the free SSL certificate:

```bash
apt install -y certbot python3-certbot-nginx
certbot --nginx -d notes.yourdomain.com --redirect -m you@isotokuhr.com --agree-tos -n
```

Certbot switches the site to HTTPS and renews the certificate automatically.

## 9. Verify

- `https://notes.yourdomain.com/api/health` should return `{"status":"ok"}`.
- `https://notes.yourdomain.com` should open the login page. Log in with the admin from step 6.1.
- Refreshing on `/notes` or `/admin` should keep the page open.

Open the site in a browser only **after HTTPS works**. The app's security headers tell browsers to load everything over HTTPS, so the page looks broken over plain `http://` or a bare IP.

---

## Updating after a new `git push`

```bash
su - deploy -c "cd ~/note-taker && git pull && npm run build"
systemctl restart careguide
```

## Backups

The free M0 tier has **no automatic backups**. To take one manually from the VPS:

```bash
. /etc/os-release
curl -fsSL https://www.mongodb.org/static/pgp/server-8.0.asc | gpg -o /usr/share/keyrings/mongodb-server-8.0.gpg --dearmor
echo "deb [ arch=amd64,arm64 signed-by=/usr/share/keyrings/mongodb-server-8.0.gpg ] https://repo.mongodb.org/apt/ubuntu ${VERSION_CODENAME}/mongodb-org/8.0 multiverse" > /etc/apt/sources.list.d/mongodb-org-8.0.list
apt update && apt install -y mongodb-database-tools

su - deploy -c 'URI=$(grep "^MONGODB_URI=" ~/note-taker/backend/.env | cut -d= -f2-); mkdir -p ~/backups; mongodump --uri="$URI" --gzip --archive=$HOME/backups/careguide-$(date +%F).gz'
```

The first block installs only MongoDB's backup tools, not the database. The last command reads the connection string from `backend/.env`, so the password never appears in your shell history.

## Free tier limits

| Limit | M0 |
|---|---|
| Storage | 512 MB |
| Connections | 500 |
| Backups | none (use `mongodump` above) |
| Uptime | the cluster pauses after **60 days without any connections**; resume it in the Atlas UI |

When the app outgrows this, upgrade the cluster in Atlas. The connection string stays the same.

## Troubleshooting

| Symptom | Cause and fix |
|---|---|
| `MongoServerSelectionError` / timeout in `journalctl -u careguide` | The VPS IP isn't in Atlas **Network Access** |
| `bad auth : authentication failed` | Wrong user or password in `MONGODB_URI`. Copy the string from Atlas again |
| `querySrv ENOTFOUND` | Typo in the cluster host, or the VPS can't resolve DNS. Check with `getent hosts google.com` |
| `Missing required environment variables` | `backend/.env` is missing or not readable by `deploy` |
| `502 Bad Gateway` from Nginx | The app isn't running. Check `systemctl status careguide` and `journalctl -u careguide -n 50` |
| Everyone gets "Too many login attempts" | `TRUST_PROXY=1` is missing from `backend/.env` |
| Certbot fails | DNS doesn't point at the VPS yet. Wait, then check `dig +short notes.yourdomain.com` |
| Page loads without styling over `http://` | Expected before HTTPS is set up. Finish step 8 |


mongodb+srv://mhmahin511_db_user:<db_password>@careguide.iuk6q8u.mongodb.net/?appName=careguide&compressors=zlib
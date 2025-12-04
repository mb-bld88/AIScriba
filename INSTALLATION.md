
# 🛠️ AIScriba Installation Guide

Follow these steps to deploy AIScriba on your server.

## 1. File Preparation (⚠️ CRITICAL STEP)

To prevent file corruption during transfer or download, some configuration files are named with a `.txt` extension.
**You must rename them manually before starting Docker.**

**In the Root folder:**
1.  Find `DOCKERFILE_ROOT.txt`
2.  Rename to: **`Dockerfile`** (remove .txt)

**In the `backend/` folder:**
1.  Find `DOCKERFILE_BACKEND_FINAL.txt`
2.  Rename to: **`Dockerfile`** (remove .txt)

**In the `backend/prisma/` folder:**
1.  Find `SCHEMA_PRISMA_FINAL.txt`
2.  Rename to: **`schema.prisma`**

---

## 2. Security Configuration (Recommended)

Before starting, change the default passwords in the configuration files.

1.  Open `docker-compose.yml`:
    *   Change `POSTGRES_PASSWORD: password_sicura` to your own strong password.
    *   Change `JWT_SECRET: super_secret_key_change_me` to a long random string.
    *   Update the `DATABASE_URL` string in the `backend` section to match your new DB password.

2.  Open `backend/prisma/seed.ts`:
    *   Locate the lines defining default users and update the passwords (`scriba_admin_pass`, etc.) to your desired values.

---

## 3. Starting with Docker

Open your terminal in the project root directory and run:

```bash
# 1. Wipe previous installations (Optional but recommended for fresh start)
docker-compose down -v

# 2. Build and Start Containers
docker-compose up --build -d
```

Wait about **60 seconds**. On the first run, the system needs to initialize the database and create the default users.

If login fails immediately, force the user creation with this command:
```bash
docker exec -it aiscriba_backend npm run seed
```

The application will be available on port **3006**: `http://YOUR_SERVER_IP:3006`

---

## 4. Fundamental Requirement: HTTPS & SSL 🔒

To record audio, browsers (Chrome, Edge, Safari) **mandatorily require** a secure **HTTPS** connection.
If you access via `http://192.168.x.x:3006`, the microphone **WILL NOT WORK** (it will be blocked by the browser security policy).

### Production Setup (Reverse Proxy)
You must configure a **Reverse Proxy** (like Nginx, Traefik, or Apache) in front of the Docker container to provide a valid SSL certificate.

**Example Nginx Configuration:**
```nginx
server {
    listen 443 ssl;
    server_name aiscriba.your-company.com;

    ssl_certificate /path/to/cert.pem;
    ssl_certificate_key /path/to/key.pem;

    # Frontend Proxy
    location / {
        proxy_pass http://localhost:3006;
        proxy_set_header Host $host;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection "upgrade";
    }

    # Backend API Proxy
    location /api/ {
        proxy_pass http://localhost:3005; 
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
    }
}
```

---

## 5. Post-Installation Configuration

### SMTP Setup (Email)
To enable the "Forgot Password" feature:
1. Log in as General Admin (`admin@aiscriba.com`).
2. Go to **Settings** (gear icon).
3. Select the **Email Configuration (SMTP)** tab.
4. Enter your mail server details (Host, Port, User, Password).
5. **Important:** Enter the **App Base URL** (e.g., `https://aiscriba.your-company.com`). This is required to generate valid reset links in emails.

### Data Storage
*   The database data is persisted in a Docker Volume named `aiscriba_pg_data`.
*   Audio files are stored as Base64 strings directly in the database (ensure your DB has enough space).

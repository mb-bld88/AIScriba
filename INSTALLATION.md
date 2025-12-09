
# 🛠️ AIScriba v1.0 - Installation Guide

This guide will walk you through setting up AIScriba on your local machine or server.

---

## ⚠️ PHASE 1: File Preparation (IMPORTANT)

To ensure compatibility during distribution, some critical configuration files were saved as text files (`.txt`).
**You must manually rename them before starting Docker.**

Navigate to the project folders and rename the files as follows:

1.  **In the root folder:**
    *   Rename `DOCKERFILE_ROOT.txt` ➡️ to **`Dockerfile`** (no extension).

2.  **In the `backend/` folder:**
    *   Rename `DOCKERFILE_BACKEND_FINAL.txt` ➡️ to **`Dockerfile`** (no extension).

3.  **In the `backend/prisma/` folder:**
    *   Rename `SCHEMA_PRISMA_FINAL.txt` ➡️ to **`schema.prisma`** (no extension).

---

## 🐳 PHASE 2: Docker Setup

Ensure you have **Docker** and **Docker Compose** installed on your system.

1.  Open your terminal in the project root folder.
2.  Clean up any old volumes (optional, for a fresh install):
    ```bash
    docker-compose down -v
    ```
3.  Start the application:
    ```bash
    docker-compose up --build -d
    ```

Wait about **60-90 seconds**. On the first run, the system needs to download dependencies, compile the frontend, and seed the database.

---

## 🔒 PHASE 3: HTTPS Requirement (Crucial for Microphone)

⚠️ **WARNING:** Modern browsers (Chrome, Edge, Safari) **block microphone access** if the site is not served via **HTTPS** (unless you are using `localhost`).

If you install AIScriba on a remote server (e.g., VPS) and access it via IP (e.g., `http://192.168.1.50:3006`), **you will not be able to record audio**.

### Production Solution (Recommended)
Use a Reverse Proxy like Nginx with an SSL certificate (e.g., Let's Encrypt).

**Nginx Configuration Example:**

```nginx
server {
    listen 443 ssl;
    server_name aiscriba.your-company.com;

    ssl_certificate /etc/letsencrypt/live/aiscriba/fullchain.pem;
    ssl_certificate_key /etc/letsencrypt/live/aiscriba/privkey.pem;

    # Frontend
    location / {
        proxy_pass http://localhost:3006;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection "upgrade";
        proxy_set_header Host $host;
    }

    # Backend API
    location /api/ {
        proxy_pass http://localhost:3001; 
        proxy_set_header Host $host;
    }
}
```

### Quick Fix for Chrome (Local Network Test Only)
If you cannot use HTTPS and need to test on a local network:
1. Open Chrome and navigate to: `chrome://flags/#unsafely-treat-insecure-origin-as-secure`
2. Add your server's IP and port (e.g., `http://192.168.1.10:3006`) to the text box.
3. Enable the flag and relaunch Chrome.

---

## 🔑 PHASE 4: Configuration

1.  Access the app (`http://localhost:3006`).
2.  Login with Default Admin credentials: `admin@aiscriba.com` / `scriba_admin_pass`.
3.  Go to **Settings (Gear Icon)** in the top right corner.

### Google API Key
AIScriba requires a Google Gemini API Key to function.
*   Follow the [Gemini API Guide](./GEMINI_API_GUIDE.md).
*   Enter the key in the "General" settings tab.

### SMTP Configuration
To enable Password Reset and email invitations:
1.  In Settings, go to the **SMTP** tab.
2.  Enter your provider details (e.g., Gmail, Outlook, SendGrid).
3.  **Important:** Set the **App Base URL** to your public address (e.g., `https://aiscriba.company.com`).

---

## ❓ Troubleshooting

**Login fails?**
Ensure the database was seeded. Run:
```bash
docker exec -it aiscriba_backend npm run seed
```

**"Network Error" or infinite loading?**
Check if containers are running:
```bash
docker ps
```
If the backend keeps restarting, check logs:
```bash
docker logs aiscriba_backend
```
Usually, this is due to incorrect DB credentials in `docker-compose.yml` or `schema.prisma`.


# 🛠️ Installation Guide - AIScriba v2.0

## Prerequisites
*   Docker & Docker Compose installed.
*   A Google Gemini API Key.

## Installation Steps

1.  **Clone the repository**
    ```bash
    git clone https://github.com/YOUR_USERNAME/aiscriba.git
    cd aiscriba
    ```

2.  **Start the Application**
    ```bash
    docker-compose up --build -d
    ```

3.  **Access**
    Go to `http://localhost:3006`.

## Production Deployment (HTTPS)

If you are deploying on a VPS/Server, you **must** use HTTPS, otherwise the browser will block microphone access.

Example `docker-compose.yml` snippet for Traefik or Nginx is recommended.

## Troubleshooting

**Database Reset:**
If you want to wipe all data and start fresh:
```bash
docker-compose down -v
docker-compose up --build -d
```

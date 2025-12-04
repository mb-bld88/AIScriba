
# 🛠️ Guida all'Installazione di AIScriba

Segui questi passaggi per installare AIScriba sul tuo server.

## 1. Preparazione dei File (Passaggio Critico ⚠️)

Per evitare corruzioni durante il trasferimento, alcuni file di configurazione sono stati nominati come `.txt`.
Prima di avviare Docker, devi rinominarli manualmente.

**Nella cartella principale:**
1.  Trova il file `DOCKERFILE_ROOT.txt`
2.  Rinominalo in: **`Dockerfile`** (senza estensione .txt)

**Nella cartella `backend/`:**
1.  Trova il file `DOCKERFILE_BACKEND_FINAL.txt`
2.  Rinominalo in: **`Dockerfile`** (senza estensione .txt)

**Nella cartella `backend/prisma/`:**
1.  Trova il file `SCHEMA_PRISMA_FINAL.txt`
2.  Rinominalo in: **`schema.prisma`**

---

## 2. Configurazione Sicurezza (Opzionale ma Consigliato)

Prima di avviare, modifica le password di default nei file di configurazione.

1.  Apri `docker-compose.yml`:
    *   Cambia `POSTGRES_PASSWORD: password_sicura` con una password tua.
    *   Cambia `JWT_SECRET: super_secret_key_change_me` con una stringa casuale lunga.
    *   Aggiorna la stringa `DATABASE_URL` nella sezione `backend` per riflettere la nuova password del DB.

2.  Apri `backend/prisma/seed.ts`:
    *   Cerca le righe dove vengono definiti gli utenti (admin, company admin) e cambia le password di default (`scriba_admin_pass`, etc.) con quelle che desideri.

---

## 3. Avvio con Docker

Apri il terminale nella cartella principale del progetto ed esegui:

```bash
# 1. Pulisci eventuali installazioni precedenti (Wipe)
docker-compose down -v

# 2. Avvia e costruisci i container
docker-compose up --build -d
```

Attendi circa 60 secondi. Al primo avvio, il sistema inizializzerà il database e creerà gli utenti di default.

Se il login non funziona subito, forza la creazione degli utenti con questo comando:
```bash
docker exec -it aiscriba_backend npm run seed
```

L'applicazione sarà disponibile sulla porta **3006**: `http://TUO_IP_SERVER:3006`

---

## 4. Requisito Fondamentale: HTTPS & SSL 🔒

Per poter registrare l'audio, i browser (Chrome, Edge, Safari) richiedono obbligatoriamente una connessione sicura **HTTPS**.
Se accedi tramite `http://192.168.x.x:3006`, il microfono **NON funzionerà** (verrà bloccato dal browser).

### Come risolvere in Produzione (Consigliato)
Devi configurare un **Reverse Proxy** con un certificato SSL (es. Let's Encrypt o certificato aziendale).

Esempio con Nginx:
```nginx
server {
    listen 443 ssl;
    server_name aiscriba.tua-azienda.it;

    ssl_certificate /path/to/cert.pem;
    ssl_certificate_key /path/to/key.pem;

    location / {
        proxy_pass http://localhost:3006; # Porta del Frontend
        proxy_set_header Host $host;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection "upgrade";
    }

    # Proxy per le API del Backend
    location /api/ {
        proxy_pass http://localhost:3005; # Porta del Backend (Esterna)
        proxy_set_header Host $host;
    }
}
```

### Come configurare l'SMTP (Email)
Per permettere il recupero password via email:
1. Accedi come Admin Generale (`admin@aiscriba.com`).
2. Vai su **Impostazioni** (icona ingranaggio).
3. Vai nel tab **Configurazione Email (SMTP)**.
4. Inserisci i dati del tuo server di posta (Host, Porta, Utente, Password).
5. Inserisci l'**URL Base** (es. `https://aiscriba.tua-azienda.it`), fondamentale per generare i link di reset funzionanti.

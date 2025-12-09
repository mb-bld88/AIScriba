
# 🛠️ Guida Completa all'Installazione di AIScriba v2.0

Questa guida ti accompagnerà passo dopo passo nell'installazione di AIScriba sul tuo server o computer locale.

---

## ⚠️ FASE 1: Preparazione dei File (IMPORTANTE)

Per garantire la massima compatibilità durante il download, alcuni file critici di configurazione sono stati salvati come testo (`.txt`).
**Devi rinominarli manualmente prima di avviare Docker.**

Vai nelle cartelle del progetto e rinomina i file come segue:

1.  **Nella cartella principale (root):**
    *   Rinomina `DOCKERFILE_ROOT.txt` ➡️ in **`Dockerfile`** (senza estensione).

2.  **Nella cartella `backend/`:**
    *   Rinomina `DOCKERFILE_BACKEND_FINAL.txt` ➡️ in **`Dockerfile`** (senza estensione).

3.  **Nella cartella `backend/prisma/`:**
    *   Rinomina `SCHEMA_PRISMA_FINAL.txt` ➡️ in **`schema.prisma`** (senza estensione).

---

## 🐳 FASE 2: Avvio con Docker

Assicurati di avere **Docker** e **Docker Compose** installati sul tuo sistema.

1.  Apri il terminale nella cartella del progetto.
2.  Esegui il comando per pulire vecchi volumi (opzionale, per installazione pulita):
    ```bash
    docker-compose down -v
    ```
3.  Avvia l'applicazione:
    ```bash
    docker-compose up --build -d
    ```

Attendi circa **60-90 secondi**. Al primo avvio, il sistema deve scaricare le dipendenze, compilare il frontend e inizializzare il database.

---

## 🔒 FASE 3: Requisito HTTPS (Cruciale per il Microfono)

⚠️ **ATTENZIONE:** I moderni browser (Chrome, Edge, Safari) **bloccano l'accesso al microfono** se il sito non è servito tramite **HTTPS** (o se non sei su `localhost`).

Se installi AIScriba su un server remoto (es. VPS) e accedi tramite indirizzo IP (es. `http://192.168.1.50:3006`), **non potrai registrare l'audio**.

### Soluzione per Produzione (Consigliata)
Usa un Reverse Proxy come Nginx con un certificato SSL (es. Let's Encrypt).

**Esempio configurazione Nginx:**

```nginx
server {
    listen 443 ssl;
    server_name aiscriba.tua-azienda.it;

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
        proxy_pass http://localhost:3001; # Nota: Il backend Docker espone sulla 3001 internamente, mappata a 3005 fuori, verifica il docker-compose
        proxy_set_header Host $host;
    }
}
```

### Soluzione Rapida per Chrome (Solo test locale)
Se non puoi usare HTTPS e devi testare in rete locale:
1. Apri Chrome e vai su: `chrome://flags/#unsafely-treat-insecure-origin-as-secure`
2. Aggiungi il tuo IP e porta (es. `http://192.168.1.10:3006`) nella casella di testo.
3. Abilita il flag e riavvia Chrome.

---

## 🔑 FASE 4: Configurazione API e SMTP

1.  Accedi all'app (`http://localhost:3006`).
2.  Usa le credenziali Admin: `admin@aiscriba.com` / `scriba_admin_pass`.
3.  Vai su **Impostazioni (Icona ingranaggio)** in alto a destra.

### Google API Key
AIScriba necessita di una chiave Google Gemini per funzionare.
*   Segui la guida dedicata: [GEMINI_API_GUIDE.md](./GEMINI_API_GUIDE.md).
*   Inseriscila nel campo "API Key" nelle impostazioni.

### Configurazione Email (SMTP)
Per far funzionare il "Password Reset" e gli inviti via email:
1.  Nel pannello Impostazioni, vai sul tab **SMTP**.
2.  Inserisci i dati del tuo provider (es. Gmail, Outlook, SendGrid).
3.  **Importante:** Imposta l'**App Base URL** con l'indirizzo pubblico del tuo sito (es. `https://aiscriba.azienda.it`). Questo serve per generare i link corretti nelle email.

---

## ❓ Risoluzione Problemi

**Il login non funziona?**
Assicurati che il database sia stato "seminato" (seeded). Esegui:
```bash
docker exec -it aiscriba_backend npm run seed
```

**Errore "Network Error" o caricamento infinito?**
Controlla che i container siano attivi:
```bash
docker ps
```
Se il backend si riavvia continuamente, controlla i log:
```bash
docker logs aiscriba_backend
```
Spesso è dovuto a credenziali DB errate nel `docker-compose.yml` o nel `schema.prisma`.

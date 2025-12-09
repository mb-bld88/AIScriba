
# 🎙️ AIScriba v2.0 - Intelligent Meeting Minutes

![AIScriba Banner](https://placehold.co/1200x300/2563eb/ffffff/png?text=AIScriba+v2.0+Enterprise)

**AIScriba** è una piattaforma enterprise self-hosted progettata per registrare, trascrivere e riassumere automaticamente le riunioni aziendali utilizzando l'Intelligenza Artificiale di Google Gemini.

Trasforma ore di conversazione in verbali strutturati, diagrammi di flusso e liste di attività in pochi secondi.

---

## ✨ Novità della v2.0

*   **Condivisione & Collaborazione:** Condividi i verbali via email con colleghi specifici.
*   **Privacy Granulare:** Imposta le riunioni come "Private" (solo tu) o "Aziendali" (tutti).
*   **Esportazione Modulare:** Scegli quali sezioni includere nel PDF (es. nascondi la trascrizione completa).
*   **Diagrammi On-Demand:** Genera diagrammi di flusso Mermaid.js solo quando serve.
*   **Compressione Audio:** Algoritmo ottimizzato (20kbps) per supportare riunioni di oltre 1 ora restando nei limiti delle API.

---

## 📚 Documentazione

Abbiamo preparato guide dettagliate per ogni fase:

1.  **[GUIDA ALL'INSTALLAZIONE (Start Here)](./INSTALLAZIONE.md)**
    *   Rinominazione file di sistema.
    *   Avvio con Docker.
    *   **Cruciale:** Configurazione HTTPS (per far funzionare il microfono).

2.  **[GUIDA API GOOGLE GEMINI](./GEMINI_API_GUIDE.md)**
    *   Come ottenere la chiave gratuita.
    *   Dove inserirla in AIScriba.

---

## 🚀 Avvio Rapido (Per esperti)

Se hai già rinominato i file e configurato l'ambiente:

```bash
docker-compose up --build -d
```

Accedi a: `http://localhost:3006`

**Credenziali di Default:**
*   **Admin:** `admin@aiscriba.com` / `scriba_admin_pass`
*   **Utente:** `mario.rossi@pincopallo.com` / `user_pass_123`

---

## ☕ Supporta il Progetto

AIScriba è un progetto open-source che richiede manutenzione continua.
Se questo software è utile alla tua azienda, considera di supportare lo sviluppo.

[![Donate](https://img.shields.io/badge/Donate-PayPal-blue.svg)](https://paypal.me/tuo_link_qui)
[![GitHub Stars](https://img.shields.io/github/stars/tuo_username/aiscriba?style=social)](https://github.com/tuo_username/aiscriba)

---

## ⚙️ Stack Tecnologico

*   **Database:** PostgreSQL 15
*   **Backend:** Node.js + Express + Prisma ORM
*   **Frontend:** React + Vite + TailwindCSS
*   **AI Engine:** Google Gemini 2.5 Flash

---

*Made with ❤️ & AI.*

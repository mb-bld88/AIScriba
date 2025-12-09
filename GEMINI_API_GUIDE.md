
# 🔑 Guida alla Google Gemini API Key

AIScriba utilizza l'intelligenza artificiale di Google (modello Gemini Flash 2.5) per trascrivere l'audio e generare i verbali. Per funzionare, è necessaria una **API Key**.

Google offre attualmente un piano gratuito molto generoso tramite **Google AI Studio**.

---

### Come ottenere la chiave (Procedura Gratuita)

1.  Vai su **Google AI Studio**: [https://aistudio.google.com/app/apikey](https://aistudio.google.com/app/apikey)
2.  Accedi con il tuo account Google (Personale o Workspace).
3.  Clicca sul pulsante blu **"Create API Key"**.
4.  Se richiesto, seleziona "Create API key in new project".
5.  Copia la stringa che appare (inizia solitamente con `AIza...`).

---

### Dove inserirla in AIScriba

Ogni utente può inserire la propria chiave personale, oppure l'Amministratore può configurarne una di default (nel codice, ma la UI supporta l'inserimento per utente).

1.  Fai il login in AIScriba.
2.  Clicca sull'icona **Ingranaggio (Impostazioni)** in alto a destra nell'header.
3.  Nel tab "Generale", trova il campo **"La tua Google Gemini API Key"**.
4.  Incolla la chiave copiata.
5.  Clicca su **Salva**.

Da questo momento, tutte le nuove registrazioni verranno elaborate usando questa chiave.

---

### Nota sui Limiti

Il modello utilizzato (`gemini-2.5-flash`) è estremamente economico e veloce. 
AIScriba ottimizza automaticamente l'audio comprimendolo a **20kbps**, permettendo di inviare registrazioni fino a circa **1 ora** in una singola chiamata API senza superare i limiti di dimensione file di Google.


# 🎙️ AIScriba - Intelligent Meeting Minutes

![AIScriba Banner](https://placehold.co/1200x300/2563eb/ffffff/png?text=AIScriba+Platform)

**AIScriba** is an enterprise self-hosted platform designed to automatically record, transcribe, and summarize business meetings using Google Gemini Artificial Intelligence.

Transform hours of conversation into structured minutes, flowcharts, and action items in seconds.

---

## ✨ Key Features

*   **Flexible Recording:** Record via microphone (in-person meetings) or capture system audio (Teams, Zoom, Meet, etc.) via browser tab sharing.
*   **Multi-Language AI:** Native support for transcription and summarization in **10 Languages**:
    *   🇺🇸 English
    *   🇮🇹 Italian
    *   🇫🇷 French
    *   🇩🇪 German
    *   🇪🇸 Spanish
    *   🇨🇳 Chinese (Mandarin)
    *   🇸🇦 Arabic
    *   🇵🇹 Portuguese
    *   🇬🇷 Greek
    *   🇮🇳 Hindi
*   **Structured Output:** Automatically generates:
    *   Executive Summary
    *   Decisions Made
    *   Action Items (Who does what by when)
    *   Mermaid Flowcharts (Visual representation of logic/processes)
    *   Full Transcription
*   **Privacy & Security:**
    *   Data stored on YOUR server (On-premise Docker).
    *   Permission management: "Private" vs "Company-wide" meetings.
    *   Automatic audio cleanup (Retention Policy).
*   **Export:** Professional PDF (A4 format) and ZIP (Audio + Markdown Text).
*   **Enterprise Management:** Multi-company support, user management, SMTP configuration.

---

## 🚀 Quick Start (Default Credentials)

After installation, the system automatically generates these users.
**Note:** "Pincopallo SPA" is a placeholder/demo company. You can delete it and create your own organization.

| Role | Email | Password |
| :--- | :--- | :--- |
| **Super Admin** | `admin@aiscriba.com` | `scriba_admin_pass` |
| **Company Admin** | `admin@pincopallo.com` | `pinco_admin_pass` |
| **Standard User** | `mario.rossi@pincopallo.com` | `user_pass_123` |

> ⚠️ **IMPORTANT:** Change these passwords immediately after the first login!

---

## 🛠️ Installation & Requirements

The application is built to run on **Docker**.

### Core Requirements
1.  **Linux/Windows Server** with Docker and Docker Compose installed.
2.  **HTTPS Required:** Modern browsers **block microphone access** if the site is served via HTTP (unless it is localhost).
    *   For production, you **MUST** use a Reverse Proxy (e.g., Nginx, Traefik) with a valid SSL certificate (Wildcard or specific).

👉 **[READ THE FULL INSTALLATION GUIDE HERE](INSTALLATION.md)**

The guide includes:
*   **Critical:** How to rename configuration files before starting.
*   How to launch containers.
*   How to configure the SSL Proxy.

---

## 🔑 AI Configuration (Google Gemini)

AIScriba requires a Google Gemini API Key to function.
The API is currently **free** for standard usage limits via Google AI Studio.

Each user can input their own key, or the administrator can manage keys.

👉 **[GUIDE TO GET YOUR API KEY](GEMINI_API_GUIDE.md)**

---

## ⚙️ Technical Details

*   **Database:** PostgreSQL 15 (Data persisted via Docker Volume `aiscriba_pg_data`).
*   **Backend:** Node.js + Express + Prisma ORM.
*   **Frontend:** React + Vite + TailwindCSS.
*   **AI Engine:** Google Gemini 2.5 Flash.

---

## ☕ Support the Project

If AIScriba helps your business or workflow, consider buying me a coffee to support future development!

[![Donate with PayPal](https://www.paypalobjects.com/en_US/i/btn/btn_donateCC_LG.gif)](https://www.paypal.com/paypalme/MattiaBarachetti)

---

*Made with ❤️ & AI.*
"# AIScriba" 
"# AIScriba" 

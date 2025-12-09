
# 🎙️ AIScriba v1.0 - Intelligent Meeting Minutes

![AIScriba Banner](https://placehold.co/1200x300/2563eb/ffffff/png?text=AIScriba+v1.0+Enterprise)

**AIScriba** is a self-hosted enterprise platform designed to automatically record, transcribe, and summarize business meetings using Google's Gemini Artificial Intelligence.

Transform hours of conversation into structured minutes, flowcharts, and action item lists in seconds.

---

## ✨ Key Features

*   **Intelligent Transcription:** Powered by Google Gemini 2.5 Flash for high accuracy.
*   **Structured Minutes:** Automatically generates Executive Summaries, Decisions, and Action Items.
*   **Visual Flowcharts:** Generates Mermaid.js diagrams from conversation logic.
*   **Enterprise Security:** Role-based access (Admin, Company Admin, User).
*   **Granular Privacy:** Choose between "Private" (personal) or "Company" (visible to colleagues) visibility.
*   **Flexible Recording:** Record via microphone (in-person) or browser tab audio (online meetings).
*   **Export:** Download minutes as PDF or comprehensive ZIP archives containing audio and Markdown.

---

## 📚 Documentation

We have prepared detailed guides for every step:

1.  **[INSTALLATION GUIDE (Start Here)](./INSTALLATION.md)**
    *   **Crucial:** How to rename the system files before starting.
    *   Docker setup.
    *   HTTPS configuration (Required for microphone access).

2.  **[GOOGLE GEMINI API GUIDE](./GEMINI_API_GUIDE.md)**
    *   How to get your free API key.
    *   Configuration steps.

---

## 🚀 Quick Start (For Experts)

*Prerequisite: Ensure you have renamed the `.txt` configuration files as described in the [Installation Guide](./INSTALLATION.md).*

```bash
docker-compose up --build -d
```

Access the app at: `http://localhost:3006`

**Default Credentials:**
*   **System Admin:** `admin@aiscriba.com` / `scriba_admin_pass`
*   **Demo User:** `mario.rossi@pincopallo.com` / `user_pass_123`

---

## ⚙️ Tech Stack

*   **Database:** PostgreSQL 15
*   **Backend:** Node.js + Express + Prisma ORM
*   **Frontend:** React + Vite + TailwindCSS
*   **AI Engine:** Google Gemini 2.5 Flash
*   **Containerization:** Docker & Docker Compose

---

## ☕ Support the Project

AIScriba is an open-source project requiring continuous maintenance.
If this software helps your business, please consider supporting development.

[![Donate](https://img.shields.io/badge/Donate-PayPal-blue.svg)](https://paypal.me/your_link_here)
[![GitHub Stars](https://img.shields.io/github/stars/your_username/aiscriba?style=social)](https://github.com/your_username/aiscriba)

---

*Made with ❤️ & AI.*

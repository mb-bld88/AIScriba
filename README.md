
# 🎙️ AIScriba v1.0 - Intelligent Meeting Minutes

![AIScriba Banner](https://placehold.co/1200x300/2563eb/ffffff/png?text=AIScriba+v1.0+Enterprise)

[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)
[![Docker](https://img.shields.io/badge/Docker-Enabled-blue.svg?logo=docker)](https://www.docker.com/)
[![Powered by Gemini](https://img.shields.io/badge/AI-Gemini%202.5-8E75B2.svg?logo=google)](https://ai.google.dev/)
[![React](https://img.shields.io/badge/Frontend-React-61DAFB.svg?logo=react)](https://reactjs.org/)
[![Prisma](https://img.shields.io/badge/ORM-Prisma-2D3748.svg?logo=prisma)](https://www.prisma.io/)
[![Status](https://img.shields.io/badge/Status-Stable-success.svg)]()

**AIScriba** is a self-hosted enterprise platform designed to automatically record, transcribe, and summarize business meetings using Google's Gemini Artificial Intelligence.

It transforms unstructured discussions into formal, structured minutes, flowcharts, and compliance-ready action item lists.

---

## 🎯 Project Philosophy: The Corporate Need

AIScriba was developed to address a specific **corporate necessity**: the requirement to formalize, verbalize, and archive discussions and decision-making processes accurately and securely.

In complex enterprise environments, informal note-taking is insufficient. This platform solves the need for:
1.  **Formal Verbalization:** Transforming informal speech into structured, professional documentation suitable for board records.
2.  **Audit Trails:** Clear, undeniable tracking of Decisions and Action Items for internal compliance.
3.  **Process Visualization:** Automatically converting spoken logic into Mermaid.js flowcharts to align technical and management teams immediately.
4.  **Data Sovereignty:** A self-hosted solution ensuring sensitive corporate strategy remains within the company's infrastructure, not on public SaaS clouds.

---

## ✨ Key Features

*   **Intelligent Transcription:** Powered by Google Gemini 2.5 Flash for high accuracy and context understanding.
*   **Structured Minutes:** Automatically generates Executive Summaries, Decisions, and Action Items.
*   **Visual Flowcharts:** Generates Mermaid.js diagrams from conversation logic.
*   **Enterprise Security:** Role-based access (Admin, Company Admin, User).
*   **Granular Privacy:** Choose between "Private" (personal) or "Company" (visible to colleagues) visibility.
*   **Flexible Recording:** Record via microphone (in-person board meetings) or browser tab audio (online calls).
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
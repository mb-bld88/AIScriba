
# Changelog

All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
and this project adheres to Semantic Versioning.

## [1.0.0] - 2024-06-15

### Initial Release
Official launch of the **AIScriba Enterprise** platform.

### Core Features
- **AI Engine:** Integration with Google Gemini Flash 2.5 for transcription and summarization.
- **Recording:** Browser-based audio recording (Microphone & System Audio via Tab Sharing).
- **Processing:** Smart audio chunking and compression (20kbps) to handle long meetings within API limits.
- **Minutes:** structured generation of Executive Summary, Decisions, Action Items, and Discussion Summary.
- **Visuals:** Automatic generation of Mermaid.js flowcharts from meeting context.

### Enterprise Features
- **Multi-Tenancy:** Support for multiple companies with distinct data separation.
- **RBAC:** Three user roles: General Admin, Company Admin, and Standard User.
- **Management:** UI for managing companies, users, and global SMTP settings.
- **Privacy:** 'Private' vs 'Company-wide' visibility settings for meeting minutes.
- **Sharing:** Ability to share specific minutes with colleagues via email.

### Technical
- **Docker:** Complete Docker and Docker Compose setup for easy deployment.
- **Database:** PostgreSQL integration via Prisma ORM.
- **Export:** PDF generation and ZIP archiving capabilities.

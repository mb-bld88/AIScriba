
# 🔑 Google Gemini API Key Guide

AIScriba uses Google's Artificial Intelligence (Gemini Flash 2.5 model) to transcribe audio and generate meeting minutes. An **API Key** is required for operation.

Google currently offers a very generous free tier via **Google AI Studio**.

---

### How to obtain a Key (Free Tier)

1.  Go to **Google AI Studio**: [https://aistudio.google.com/app/apikey](https://aistudio.google.com/app/apikey)
2.  Log in with your Google Account (Personal or Workspace).
3.  Click the blue **"Create API Key"** button.
4.  If prompted, select "Create API key in new project".
5.  Copy the string that appears (it usually starts with `AIza...`).

---

### How to configure it in AIScriba

Every user can enter their own personal key, or the Administrator can configure a default one (via code, though UI supports per-user keys).

1.  Log in to AIScriba.
2.  Click the **Gear Icon (Settings)** in the top right header.
3.  In the "General" tab, find the **"Your Google Gemini API Key"** field.
4.  Paste your key.
5.  Click **Save**.

From this moment on, all new recordings will be processed using this key.

---

### Note on Limits

The model used (`gemini-2.5-flash`) is extremely cost-effective and fast.
AIScriba automatically optimizes audio by compressing it to **20kbps**, allowing you to send recordings of up to approximately **1 hour** in a single API call without exceeding Google's file size limits.

# 🏫 CampusTrack – Intelligent Lost and Found Locator
---
[Visit site](https://campustrack-5xor.onrender.com/)
(Backend is not hosted after freetier)
---
An AI-powered **Lost and Found management system** for campuses built using **Spring Boot (Java 21)**, **MySQL**, and **React + Tailwind**.  
CampusTrack helps users **report lost items**, **upload images**, and later **match found items intelligently**.

---

## 🚀 Features

An integrated Lost & Found management system for campuses. This repository contains three main parts:
- `lostandfound` — Java Spring Boot backend (Maven)
- `campustrack-frontend` — React + Vite frontend (admin UI + public views)
- `campustrack-ai` — small Python AI/ML helper (local experimentation)

This README has been updated to reflect recent frontend improvements (Admin Dashboard: green accent theme, animated brand and logo, up/down brand animation, and Manage Users filters) and the current directory layout.

---

## 🚀 Highlights / Recent Modifications

- Admin Dashboard (`campustrack-frontend/src/components/AdminDashboard.jsx` + `AdminDashboard.css`):
	- Light navbar with green accent theme (replaces earlier blue/cyan).
	- Animated brand text "CampusTrack" with neon gradient, pulsing underline, and vertical (up/down) motion.
	- Small animated SVG logo synced with the brand (entrance + bounce).
	- Manage Users: fully functional filters for email and role (`userFilterEmail`, `userFilterRole`, `filteredUsers`).
	- Card/grid polish: pastel gradients and subtle neon borders for stat cards.

---

## 🧩 Current Repository Structure

Top-level layout (paths relative to the repo root):

```
README.md
campustrack-ai/
	├─ app.py
	├─ requirements.txt
	└─ model_cache/

campustrack-frontend/
	├─ index.html
	├─ package.json
	├─ vite.config.js
	├─ src/
	│  ├─ main.jsx
	│  ├─ App.jsx
	│  ├─ index.css
	│  ├─ App.css
	│  ├─ assets/
	│  └─ components/
	│     ├─ AdminDashboard.jsx
	│     ├─ AdminDashboard.css
	│     ├─ AnimatedBackground.jsx
	│     ├─ AnimatedBackground.css
	│     ├─ LoginSignup.jsx
	│     ├─ FoundItemForm.jsx
	│     ├─ LostItemForm.jsx
	│     ├─ ViewFoundItems.jsx
	│     ├─ ViewLostItems.jsx
	│     ├─ MatchSidebar.jsx
	│     ├─ AttributeMatcher.jsx
	│     └─ (other components...)
	└─ public/
		 ├─ found.html
		 ├─ manifest.json
		 └─ service-worker.js

lostandfound/
	├─ mvnw
	├─ mvnw.cmd
	├─ pom.xml
	├─ src/
	│  ├─ main/
	│  │  ├─ java/com/campustrack/lostandfound/
	│  │  │  ├─ controller/
	│  │  │  ├─ model/
	│  │  │  ├─ repository/
	│  │  │  ├─ service/
	│  │  │  └─ websocket/
	│  │  └─ resources/
	│  │     ├─ application.properties
	│  │     └─ static/
	└─ target/ (build outputs)

uploads/

```

---

## 💻 Quick Setup & Run (local development)

Notes: commands are for Windows PowerShell (adjust `cd` paths as needed). If you prefer Unix/macOS, use `./mvnw` instead of `mvnw.cmd` and standard shell commands.

1) Backend (Spring Boot)

```powershell
cd .\lostandfound
# Use the included Maven wrapper on Windows
.\mvnw.cmd clean install
.\mvnw.cmd spring-boot:run
```

The backend will listen on http://localhost:8080 by default (check `application.properties`).

2) Frontend (React + Vite)

```powershell
cd ..\campustrack-frontend
npm install
npm run dev
```

By default Vite serves at http://localhost:5173 — open the Admin Page to preview the Admin Dashboard.

3) AI helper (optional)

```powershell
cd ..\campustrack-ai
python -m venv .venv
.\.venv\Scripts\Activate.ps1
pip install -r requirements.txt
python app.py
```

This is a lightweight helper service/experiment environment for model-based matching (optional).

---

## 🛠️ Notes & Developer Tips

- Admin Dashboard tweaks are in `campustrack-frontend/src/components/AdminDashboard.jsx` and styled in `AdminDashboard.css`.
- If you change animations, remember `prefers-reduced-motion` media query is present — preserve it for accessibility.
- The project uses a Maven wrapper for the backend (`mvnw.cmd`) so you don't need a globally installed Maven.
- For frontend work, run `npm run dev` inside `campustrack-frontend` and open the browser to the Vite URL.

---

## 🧑‍💻 Contributors

- Vivek L — main developer (@vivek8085)

---

## 📜 License

MIT — feel free to use, modify and distribute.

---

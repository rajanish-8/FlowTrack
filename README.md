# FlowTrack

> **Smart Project Management & Team Collaboration Platform**  
> Major Project — Department of Computer Science & Engineering, Medi-Caps University (2026)

[![Python 3.11](https://img.shields.io/badge/Python-3.11-3776AB?logo=python&logoColor=white)](https://python.org)
[![Django](https://img.shields.io/badge/Django-4.x-092E20?logo=django&logoColor=white)](https://djangoproject.com)
[![React](https://img.shields.io/badge/React-19-61DAFB?logo=react&logoColor=black)](https://react.dev)
[![Vite](https://img.shields.io/badge/Vite-7.x-646CFF?logo=vite&logoColor=white)](https://vitejs.dev)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](LICENSE)

---

## ✨ Features

| Feature | Description |
|---|---|
| 🗂️ **Kanban Board** | Drag-and-drop task management with fractional-index ordering |
| 📅 **Calendar View** | Full monthly calendar with task due-date visualization |
| 📋 **Table View** | Spreadsheet-style task list with inline editing |
| 🧮 **Eisenhower Matrix** | Prioritize tasks by urgency vs importance quadrants |
| 🗓️ **Roadmap** | Milestone timeline view across sprints |
| 📊 **Analytics Dashboard** | Burndown charts, sprint velocity, time-tracking reports |
| 👥 **Team Directory** | Manage members, roles (Owner / Manager / Member), skills |
| 🤝 **CRM (Clients)** | Track clients, deals, pipeline stages, contacts |
| 📑 **Documentation Hub** | Access all 5 milestone presentations & final project report |
| 🔔 **Activity Log** | Real-time feed of all project events |
| ⏱️ **Time Tracking** | Built-in stopwatch with per-task time logs |
| 🔑 **Role-Based Access** | Owner / Manager / Member privilege matrix |
| 🌙 **Dark / Light Mode** | Toggle with preference saved to `localStorage` |
| ⌨️ **Keyboard Shortcuts** | Full keyboard navigation across all 10 tabs |

---

## 🏗️ Tech Stack

| Layer | Technology |
|---|---|
| **Frontend** | React 19, Vite 7, CSS3 (Clay Design) |
| **Backend** | Django 4, Django REST Framework |
| **Database** | SQLite (dev) → PostgreSQL (prod) |
| **Auth** | Token-based authentication (DRF) |
| **Deployment** | Docker + docker-compose |

---

## 📁 Project Structure

```
FlowTrack/
├── Backend/
│   └── flowtrack/           # Django project
│       ├── flowtrack/       # Settings, URLs, WSGI
│       ├── kanbanboard/     # Main app (models, views, serializers)
│       ├── migrations/      # DB migrations
│       ├── seed_enterprise_data.py
│       └── manage.py
├── frontend/
│   ├── src/
│   │   ├── components/      # 20+ React components
│   │   ├── pages/           # Board, Landing, Login, Signup
│   │   ├── layouts/         # Header, ColumnContainer
│   │   └── utils/           # API client, helpers
│   ├── public/
│   │   └── documentation/   # Presentations & report files
│   └── vite.config.js
├── Documentation/           # All academic documents (local only)
├── docker-compose.yml
├── run.bat                  # One-click dev startup (Windows)
└── README.md
```

---

## 🚀 Quick Start

### Prerequisites
- Python 3.11+
- Node.js 18+
- npm / pnpm

### 1. Clone the repo
```bash
git clone https://github.com/carnosys/FlowTrack.git
cd FlowTrack
```

### 2. Backend setup
```bash
cd Backend/flowtrack
python -m venv venv
venv\Scripts\activate          # Windows
# source venv/bin/activate     # Linux/Mac

pip install -r requirements.txt
python manage.py migrate
python manage.py createsuperuser
python manage.py runserver
```

### 3. Frontend setup
```bash
cd frontend
npm install
npm run dev
```

App runs at: **http://localhost:5173**  
API runs at: **http://localhost:8000**

### 4. One-click (Windows)
```bat
run.bat
```

---

## 🐳 Docker

```bash
docker-compose up --build
```

---

## 📚 Academic Details

| Field | Value |
|---|---|
| **Institution** | Medi-Caps University, Indore |
| **Department** | Computer Science & Engineering |
| **Subject Code** | CS3PC05 — Major Project |
| **Supervisor** | Mr. Pradeep Kumar Mehta |
| **Team** | Priyanshu Choudhary, Rajanish Kumrawat, Priyanshu Tiwari |
| **Session** | 2025–2026 |

---

## 📄 License

MIT License — see [LICENSE](LICENSE) for details.

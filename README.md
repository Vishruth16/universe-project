# UniVerse

A university social platform that connects students through marketplace listings, housing searches, roommate matching, and study groups — powered by AI recommendations and real-time WebSocket notifications.

## Features

- **Marketplace** — Buy and sell items with in-app messaging
- **Housing** — Browse and post housing listings with inquiry threads
- **Roommate Matching** — AI-powered profile matching with compatibility scoring
- **Study Groups** — Create and join study groups with real-time group chat
- **AI Recommendations** — FAISS-based semantic search using sentence-transformers
- **Real-Time Notifications** — WebSocket push for messages, match requests, and unread counts

## Tech Stack

| Layer | Technology |
|-------|-----------|
| Frontend | React 19, TypeScript, Material UI 6 |
| Backend | Django 4.2, Django REST Framework |
| Real-Time | Django Channels, Daphne (ASGI), WebSockets |
| Database | PostgreSQL |
| AI/ML | sentence-transformers, FAISS |
| Auth | Token auth + JWT |

## Prerequisites

- Python 3.10+
- Node.js 18+
- PostgreSQL

## Getting Started

### 1. Clone the repository

```bash
git clone https://github.com/Vishruth16/universe-project.git
cd universe-project
```

### 2. Backend Setup

```bash
cd universe-backend

# Create and activate a virtual environment
python -m venv venv
# Windows
venv\Scripts\activate
# macOS/Linux
source venv/bin/activate

# Install dependencies
pip install -r requirements.txt

# Set up environment variables
cp .env.example .env
# Edit .env with your actual values (SECRET_KEY, DB_PASSWORD, etc.)
```

### 3. Database Setup

Create a PostgreSQL database:

```sql
CREATE DATABASE universe_db;
```

Then run migrations:

```bash
python manage.py migrate
```

### 4. Seed Data (Optional)

```bash
# Seed sample users, profiles, listings, etc.
python manage.py seed_data

# Build FAISS indexes for AI recommendations
python manage.py rebuild_faiss_indexes
```

### 5. Start the Backend

```bash
python manage.py runserver
```

The API will be available at `http://localhost:8000/api/`.

### 6. Frontend Setup

Open a new terminal:

```bash
cd universe-frontend

# Install dependencies
npm install

# Start the dev server
npm start
```

The app will open at `http://localhost:3000`.

## Project Structure

```
universe-project/
├── universe-backend/
│   ├── auth_api/              # Registration & login endpoints
│   ├── user_profiles/         # User profiles & roommate profiles
│   ├── marketplace/           # Item listings & messages
│   ├── housing/               # Housing listings & inquiries
│   ├── roommate_matching/     # Match requests, compatibility scoring
│   ├── study_groups/          # Study groups & group messages
│   ├── ai_recommendations/    # FAISS indexes, RAG pipeline, embeddings
│   ├── notifications/         # Notifications, WebSocket consumers
│   └── universe_backend/      # Django settings, URLs, ASGI config
├── universe-frontend/
│   ├── src/
│   │   ├── contexts/          # Auth, Message, Notification, WebSocket
│   │   ├── features/          # Marketplace, Housing, Roommate, Study Groups
│   │   ├── pages/             # Home, Login, Register, Messages, Profile
│   │   ├── components/        # Navbar, ChatPanel, NotificationBell
│   │   └── services/          # API service layers
│   └── public/
└── README.md
```

## API Endpoints

| Prefix | Resource |
|--------|----------|
| `/api/users/` | User accounts |
| `/api/profiles/` | User profiles |
| `/api/roommate-profiles/` | Roommate preferences |
| `/api/marketplace-items/` | Marketplace listings |
| `/api/marketplace-messages/` | Item messages |
| `/api/housing-listings/` | Housing listings |
| `/api/housing-inquiries/` | Housing inquiries |
| `/api/match-requests/` | Roommate match requests |
| `/api/roommate-matches/` | Compatibility matches |
| `/api/study-groups/` | Study groups |
| `/api/notifications/` | Notifications |
| `/api/recommendations/` | AI recommendations |
| `/api/auth/` | Login, register, token refresh |
| `ws/notifications/` | WebSocket (real-time events) |

## Environment Variables

See `.env.example` for the full list:

| Variable | Description |
|----------|-------------|
| `SECRET_KEY` | Django secret key |
| `DEBUG` | Debug mode (`True`/`False`) |
| `DB_NAME` | PostgreSQL database name |
| `DB_USER` | Database user |
| `DB_PASSWORD` | Database password |
| `DB_HOST` | Database host |
| `DB_PORT` | Database port |

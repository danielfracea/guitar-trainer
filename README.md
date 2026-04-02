# Guitar Trainer

A JavaScript full-stack web app for customizable guitar practice exercises.

![Guitar Trainer Screenshot](https://github.com/user-attachments/assets/0858d87d-c75f-4165-bada-83910bf4a29b)

## Stack

- **Backend**: Node.js + Express (REST API on port 3001)
- **Frontend**: Vue 3 + Vite (dev server on port 5173)

## Features

- 5 built-in guitar exercises: Scale Practice, Chord Transitions, Fingerpicking Pattern, Barre Chord Practice, Pentatonic Runs
- Each exercise is fully customizable (root note, scale type, tempo, chord sequence, pattern, etc.)
- Dark guitar-themed UI with amber/green accents
- Save customizations via REST API
- Reset all exercises to defaults

## Getting Started

### Install dependencies

```bash
cd backend && npm install
cd ../frontend && npm install
```

### Run the app

```bash
# Terminal 1 – backend API (http://localhost:3001)
cd backend && npm start

# Terminal 2 – frontend dev server (http://localhost:5173)
cd frontend && npm run dev
```

## API Endpoints

| Method | Path | Description |
|--------|------|-------------|
| GET | `/api/exercises` | List all exercises |
| GET | `/api/exercises/:id` | Get a single exercise |
| PUT | `/api/exercises/:id` | Update/customize an exercise |
| POST | `/api/exercises/reset` | Reset all exercises to defaults |
| GET | `/health` | Health check |

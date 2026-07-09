![HTML](https://img.shields.io/badge/HTML-5-orange)
![CSS](https://img.shields.io/badge/CSS-3-blue)
![JavaScript](https://img.shields.io/badge/JavaScript-ES6-yellow)
![Supabase](https://img.shields.io/badge/Supabase-PostgreSQL-green)
![License](https://img.shields.io/badge/License-MIT-lightgrey)
![Version](https://img.shields.io/badge/Version-v2.0.0-00ff66)

# 🧠 Mind Heist

### A Full-Stack Hacker-Themed Puzzle Game with Real-Time Analytics & DBMS Integration
> *"Not just solving puzzles... you're cracking the system."*

---

## 🚀 Project Overview

**Mind Heist** is a hacker-themed puzzle game built using **HTML, CSS, JavaScript, and Supabase (PostgreSQL)**. The game challenges players with progressively difficult logical, mathematical, binary, hexadecimal, and cipher-based puzzles while demonstrating the practical implementation of **Database Management System (DBMS)** concepts.

Unlike a traditional puzzle game, Mind Heist persists user progress, scores, analytics, and clan information in a relational database, making it a complete data-driven web application.

---

## 🌐 Live Demo

🚀 **Play Mind Heist Online**

👉 https://mindheist-puzzle.vercel.app/

# ✨ Features

## 🎮 Gameplay

- 🧩 9 progressively harder levels (Boot Sector → Dark Nexus)
- 🔢 Dynamic puzzle generation
- ⏱️ Countdown timer with visual warnings
- 💡 Hint system
- ⭐ Score calculation based on correctness and speed
- 🔓 Automatic level unlocking

---

## 📊 Analytics

- Accuracy percentage
- Average solving time
- Total games played
- Best level reached
- Total score
- Recent performance trend

---

## 🏆 Leaderboards

- 🌍 Global Leaderboard
- ⚡ Fastest Players Leaderboard
- 🎯 Accuracy Leaderboard
- 🏴 Clan Leaderboard

---

## 🏴 Clan System

- Create clans
- Join existing clans
- Leave clans
- View clan members
- Automatic clan score calculation

---

## 👤 User System

- Secure registration using Supabase Authentication
- Email & password login
- JWT-based session persistence
- Automatic session restoration
- Secure logout

---

## 🎨 User Interface

- Matrix rain animation
- Cyberpunk hacker theme
- Neon UI
- Responsive layout
- Toast notifications
- Smooth screen transitions
- Glitch text effects

---

# 🛠 Tech Stack

| Technology | Purpose |
|------------|---------|
| HTML5 | Structure |
| CSS3 | Styling & Animations |
| JavaScript (ES6) | Game Logic |
| Supabase | Backend-as-a-Service |
| PostgreSQL | Relational Database |
| Git & GitHub | Version Control |
| Vercel | Deployment |

---

# 📂 Project Structure

```text
Mind-Heist/
│
├── index.html
│
├── css/
│   ├── style.css
│   ├── animations.css
│   ├── leaderboard.css
│   ├── analytics.css
│   └── responsive.css
│
├── js/
│   ├── config.js          # Local configuration (ignored)
│   ├── db.js              # Database layer
│   ├── puzzles.js         # Puzzle engine
│   ├── ui.js              # UI management
│   ├── auth.js            # Authentication
│   ├── game.js            # Gameplay logic
│   ├── leaderboard.js     # Leaderboards
│   ├── analytics.js       # Analytics dashboard
│   ├── clans.js           # Clan management
│   └── app.js             # Application entry point
│
├── assets/
│
├── screenshots/
│
├── config.example.js
├── README.md
└── .gitignore
```

---

# 🗄 Database Schema

## Users

| Column        | Description            |
| ------------- | ---------------------- |
| id (UUID, PK) | Linked to auth.users   |
| username      | Display name           |
| clan          | Clan code              |
| total_score   | Overall score          |
| best_level    | Highest unlocked level |
| created_at    | Account creation time  |


---

## Scores

| Column            | Description |
| ----------------- | ----------- |
| id                | Score row   |
| user_id (UUID FK) | Player      |
| level_id          | Level       |
| score             | Best score  |

---

## Attempts

| Column            | Description       |
| ----------------- | ----------------- |
| id                | Attempt           |
| user_id (UUID FK) | Player            |
| level_id          | Level             |
| puzzle_index      | Puzzle            |
| is_correct        | Correct/Incorrect |
| time_taken        | Seconds           |
| attempts_count    | Attempts          |
| created_at        | Timestamp         |


---

## Clans

| Column      | Description       |
| ----------- | ----------------- |
| code        | Clan code         |
| name        | Clan name         |
| total_score | Cached clan score |
| members     | UUID[]            |


---

# 🧠 DBMS Concepts Demonstrated

The project demonstrates several practical database concepts including:

- Relational Database Design
- Normalization
- Primary Keys
- Foreign Keys
- CRUD Operations
- Aggregation (SUM, AVG, COUNT)
- Sorting (ORDER BY)
- Conflict Resolution (UPSERT)
- Query-based Analytics
- One-to-Many Relationships
- Real-time Data Persistence
- Row Level Security (RLS)
- Authentication using Supabase Auth
- UUID-based relational design
- Database indexing

---

# ⚙️ Setup Instructions

## 1. Clone the Repository

```bash
git clone https://github.com/r0-vex/Mind-Heist.git
```

---

## 2. Navigate to the Project

```bash
cd Mind-Heist
```

---

## 3. Create `js/config.js`

```javascript
const CONFIG = {
    SUPABASE_URL: "YOUR_SUPABASE_URL",
    SUPABASE_ANON_KEY: "YOUR_SUPABASE_ANON_KEY"
};
```

---

## 4. Configure Supabase

Create the following tables:

- users
- scores
- attempts
- clans

The schema is available in the project documentation.

---

## 5. Run the Project

Simply open

```text
index.html
```

or use **VS Code Live Server**.

---

# 📸 Screenshots

### 🔐 Login
<p align="center">
  <img src="screenshots/login.png" width="900">
</p>

### 🎮 Level Selection
<p align="center">
  <img src="screenshots/levels.png" width="900">
</p>

### 🧩 Gameplay
<p align="center">
  <img src="screenshots/gameplay.png" width="900">
</p>

### 🏆 Leaderboard
<p align="center">
  <img src="screenshots/leaderboard.png" width="900">
</p>

### 📊 Analytics Dashboard
<p align="center">
  <img src="screenshots/analytics.png" width="900">
</p>

### 🏴 Clan Leaderboard
<p align="center">
  <img src="screenshots/clans.png" width="900">
</p>

### 👥 Clan Management
<p align="center">
  <img src="screenshots/clan_system.png" width="900">
</p>

# 🔐 Security

Mind Heist v2 introduces production-oriented security improvements:

- Supabase Authentication
- JWT-based session management
- Row Level Security (RLS)
- UUID-based user identities
- No plaintext password storage
- Client-safe public anon key
- Database access restricted by policies

---

# 🚀 Future Enhancements

- Performance graphs
- Puzzle category statistics
- AI-generated puzzles
- Multiplayer battles
- Achievement badges
- Global events
- Progressive Web App (PWA)
- Multiplayer clan wars
- Realtime leaderboards
- Achievements
- Daily challenges
- Clan chat
- RPC-based clan synchronization
- PWA support

---

# 📚 Learning Outcomes

Through this project we implemented:

- Frontend development using HTML, CSS and JavaScript
- Backend integration using Supabase
- Relational database management
- SQL queries and aggregation
- CRUD operations
- User authentication
- Data visualization
- Modular JavaScript architecture
- Responsive web design
- Git and GitHub workflow

---

# 👨‍💻 Authors

**Rohith**

**Diksha**

---

## 📄 License

This project is licensed under the **MIT License**. See the [LICENSE](LICENSE) file for details.

---

⭐ If you found this project interesting, consider giving it a **Star** on GitHub!

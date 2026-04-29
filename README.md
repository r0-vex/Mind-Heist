# 🧠 Mind Heist

### A Hacker-Themed Puzzle Game with DBMS Integration

> “Not just solving puzzles… you're cracking the system.”

---

## 🚀 Project Overview

**Mind Heist** is a hacker-style puzzle game designed to test logical thinking, pattern recognition, and problem-solving skills.
Unlike traditional games, it integrates **real database concepts** using Supabase to store and analyze user performance.

This project demonstrates how **DBMS concepts + frontend systems** can be combined to build an interactive, data-driven application.

---

## 🎮 Features

* 🧩 **Dynamic Puzzle Engine**

  * Generates puzzles based on difficulty
  * Includes sequences, logic, binary, cipher-based questions

* 🧠 **User Progress Tracking**

  * Tracks score, level progression, and attempts
  * Stores all data in a relational database

* 🏆 **Leaderboard System**

  * Global leaderboard (top players)
  * Clan-based leaderboard

* 🏴‍☠️ **Clan System**

  * Create and join clans
  * Track total clan performance

* 📊 **Analytics Dashboard**

  * Accuracy %
  * Average solving time
  * Total games played
  * Recent performance trend (🟢 / 🔴)

* 🔐 **Authentication System**

  * Login / Register
  * Session persistence (auto-login)

* 🎨 **Hacker-Themed UI**

  * Matrix-style visuals
  * Neon cyber interface

---

## 🛠️ Tech Stack

* **Frontend:** HTML, CSS, JavaScript
* **Backend (BaaS):** Supabase (PostgreSQL)
* **Database Concepts Used:**

  * Tables & Relationships
  * Primary & Foreign Keys
  * Aggregation
  * Data normalization
  * Query-based analytics

---

## 🗄️ Database Schema

### Users

* `username` (PK)
* `pass`
* `clan`
* `total_score`
* `best_level`

### Scores

* `id` (PK)
* `username` (FK)
* `level_id`
* `score`

### Attempts

* `id` (PK)
* `username` (FK)
* `level_id`
* `puzzle_index`
* `is_correct`
* `time_taken`
* `attempts_count`
* `ts` (timestamp)

### Clans

* `code` (PK)
* `name`
* `total_score`
* `members`

---

## ⚙️ Setup Instructions

1. Clone the repository:

```bash
git clone https://github.com/your-username/mind-heist.git
```

2. Create a `config.js` file:

```js
export const SUPABASE_URL = "YOUR_SUPABASE_URL";
export const SUPABASE_ANON = "YOUR_SUPABASE_ANON_KEY";
```

3. Open `index.html` in browser

---

## 📸 Screenshots

> <img width="1365" height="640" alt="image" src="https://github.com/user-attachments/assets/ef1c2e4e-aca1-4fa5-93db-eb08c0b16729" />
<img width="1365" height="641" alt="image" src="https://github.com/user-attachments/assets/96745b76-a7b9-4daa-83c2-aaef2b9c200e" />
<img width="1365" height="636" alt="image" src="https://github.com/user-attachments/assets/706cbe8d-f6fc-4c67-88c7-71f9967e27c7" />
<img width="1365" height="642" alt="image" src="https://github.com/user-attachments/assets/56316519-53d1-48ba-bd32-a8643b98396f" />



---

## 🧠 Key Concepts Demonstrated

* Real-time data handling using Supabase
* Relational database design
* Data aggregation and analytics
* Frontend + DB integration
* User-based performance tracking

---

## 🔐 Security Note

This project uses the **Supabase anon public key** for frontend access.
For simplicity, **Row Level Security (RLS) is disabled**.

> In production systems, proper authentication and access control policies would be implemented.

---

## 🚧 Future Enhancements

* 📊 Advanced analytics (weak topics, speed per category)
* 📈 Graph-based performance tracking
* 🧠 AI-based difficulty adjustment
* 🌐 Multiplayer puzzle battles
* 🔒 Secure authentication with RLS

---

## 🏁 Conclusion

Mind Heist showcases how database systems can go beyond storage and become the backbone of an intelligent application.
It combines **logic, design, and data** to create an engaging and scalable system.

---

## 👨‍💻 Author

**Rohith**
**Diksha**

---

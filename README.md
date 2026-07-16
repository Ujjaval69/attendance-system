# 🎓 Smart Attendance System

A next-generation, secure, and role-gated classroom compliance dashboard. Designed with an editorial minimalist aesthetic, interactive analytics charts, and a hardware-accelerated 3D parallax layout.

This project features secure role permissions separating **Administrators (Teachers)** and **Students**, protecting database integrity while delivering real-time statistics.

---

## ✨ Features

### 🎨 1. Premium Editorial UI/UX
* **Scandinavian Minimalist Theme**: Re-engineered using a clean **Warm Alabaster & Forest Green** default theme and a secondary **Carbon Black & Sage Green** dark mode.
* **3D Perspective Hover Tilt**: Glassmorphic panels and charts react dynamically to mouse coordinates with smooth, hardware-accelerated X and Y rotations.
* **Viewport Scroll Reveal**: Content grids and cards slide and fade up gracefully into view as they enter the screen.

### 📊 2. Deep Analytics & Heatmaps
* **30-Day Contribution Heatmap**: A GitHub-style calendar contribution matrix visualising daily student attendance statuses (**Present (Green)**, **Absent (Red)**, **Late (Yellow)**).
* **Dynamic Chart.js Insights**: Animated doughnut and bar charts mapping cumulative attendance ratios and subject-wise performance rates in real-time.
* **At-Risk Diagnostics**: Automated card panel surfacing student profiles tracking below the final-exam compliance threshold (**<75% rate**).

### ⚙️ 3. Administrative Capabilities
* **Demo Simulation Seeder**: One-click mock seeder button (Admin only) that injects 15 realistic historical records across a month for a student to instantly populate dashboards for demonstration.
* **Filter-Aware CSV compiler**: Instant CSV formatter that packages active table search parameters into spreadsheet documents for download.
* **Inline Modal Editing**: Allow educators to correct individual student logs dynamically on the fly without refreshing the page.

### 🔒 4. Enterprise Security
* **JWT Gated Sessions**: Secured token auth verifying claims on every API request.
* **Signup Secret Keys**: Admin registration is protected by an invitation secret code verification gate, preventing unauthorized permission escalations.
* **Role Gating Middleware**: Students are restricted to read-only views of their own records, blocking write and modify request vectors.

---

## 🛠️ Tech Stack

* **Frontend**: HTML5, Vanilla JavaScript (ES6+), Vanilla CSS (Custom Variable tokens, blur backdrops), Chart.js (CDN).
* **Backend**: Node.js, Express.js.
* **Database**: MongoDB (Object modeling using Mongoose).
* **Auth**: JSON Web Tokens (JWT), bcryptjs encryption.

---

## 🚀 Getting Started

### Prerequisites
* [Node.js](https://nodejs.org/) installed.
* [MongoDB](https://www.mongodb.com/) running locally (`mongodb://localhost:27017/`).

### Installation

1. Clone this repository to your local machine:
   ```bash
   git clone https://github.com/Ujjaval69/attendance-system.git
   cd attendance-system
   ```

2. Install dependencies:
   ```bash
   npm install
   ```

3. Create a `.env` file in the root directory:
   ```env
   PORT=3000
   MONGO_URI=mongodb://localhost:27017/attendanceDB
   JWT_SECRET=your_jwt_secret_key_here
   ADMIN_SECRET_KEY=admin_secure_key_2026
   ```

4. Start the server:
   ```bash
   npm start
   ```
   The application will run on **`http://localhost:3000`**.

---

## 🧪 Running API Endpoint Tests

A test script is included to verify all backend security rules, signup token generation, student access limits, and admin permission gates.

Run it in your terminal:
```bash
node scratch/test_api.js
```

---

## 📂 Project Structure

```
├── config/              # DB connection config
├── middleware/          # JWT checks and logger filters
├── models/              # User and Attendance Mongoose schemas
├── routes/              # Express Auth and Attendance routes
├── public/              # Frontend client assets
│   ├── index.html       # Public landing page with simulation triggers
│   ├── dashboard.html   # Main glassmorphic analytics console
│   ├── login.html       # Auth login form
│   ├── signup.html      # Registration gate (invite codes input)
│   ├── script.js        # Chart compiler and DOM listeners
│   └── style.css        # Themes and 3D parallax layout variables
├── server.js            # App listener & static files mount
└── README.md            # Project description
```

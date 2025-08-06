# 📝 Modern Blog System

A professional blogging platform built with **Node.js**, **Express**, **MongoDB**, and **React**, featuring authentication, rich post management, categories, comments, and dark/light mode.

---

## 🚀 Features

- 🔐 Role-based auth (Admin, Editor, User)
- ✍️ Create/edit/delete posts with tags & categories
- 💬 Comments with moderation
- 🌗 Light/dark mode toggle
- 🔎 Search, filter, pagination
- ✅ Real-time validation & error handling
- 🔒 JWT-based secure API

---

## 🧱 Tech Stack

| Layer      | Tech                         |
|------------|------------------------------|
| Backend    | Node.js, Express.js          |
| Database   | MongoDB, Mongoose            |
| Frontend   | React, Tailwind CSS          |
| Auth       | JWT                          |
| Tooling    | Nodemon, Axios, Lucide Icons |

---

## 📁 Project Structure

```
blog-system/
├── server/         # Backend
│   ├── config/     # DB config
│   ├── models/     # Mongoose models
│   ├── routes/     # API routes
│   ├── middleware/ # Auth middleware
│   └── server.js   # Entry point
├── client/         # Frontend (React)
│   ├── src/
│   └── tailwind.config.js
```

---

## ⚙️ Setup Instructions

### 📦 Prerequisites

- Node.js v18+
- MongoDB running locally
- Git (optional)

### 🔧 Backend Setup

```bash
cd server
npm install
```

Create a `.env` file in the `server/` directory with the following content:

```
PORT=5000
MONGODB_URI=mongodb://localhost:27017/blog-system
JWT_SECRET=your-super-secret-key
NODE_ENV=development
```

Start the backend server:

```bash
npm run dev
```

### 🎨 Frontend Setup

```bash
cd client
npm install
npm start
```

---

## 🌍 Access

- Frontend: http://localhost:3000
- Backend API: http://localhost:5000/api

---

## 🧪 Testing

Use the following test credentials:

- **Admin Login**: `admin@test.com` / `password123`

Try out:

- Creating posts
- Editing/deleting
- Posting comments
- Switching dark/light mode

---

## 🛠️ Troubleshooting

- MongoDB connection errors? Ensure MongoDB is running (`services.msc`)
- Port in use? Modify `PORT` in `.env`
- React crashes? Try:
  ```bash
  npm cache clean --force
  ```

---

## 🤝 Contributing

1. Fork the repository  
2. Create a new branch (`git checkout -b feature-name`)  
3. Commit your changes  
4. Open a Pull Request

---
Thank You 🙏🏻

---


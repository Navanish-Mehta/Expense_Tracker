# 💰 Expense Tracker Web App  

A modern and intuitive **Full-Stack Expense Tracker Web Application** designed to help you manage your finances effectively. Track your expenses, set budgets, and visualize spending habits with interactive analytics – all in one place! 🚀  

---

## ✨ Features  

- 🔐 **User Authentication** – Secure JWT-based login/register system  
- 💸 **Expense Management** – Add, edit, delete, and categorize expenses  
- 📊 **Analytics Dashboard** – Beautiful charts & insights for better financial planning  
- 🎯 **Budget Tracking** – Set monthly budgets & get alerts when you overspend  
- 📱 **Responsive Design** – Clean & modern UI, works on all devices  
- ⚡ **Fast & Reliable** – Built on MERN Stack with robust backend APIs  

---

## 🛠 Tech Stack  

### 🔹 Backend  
- **Node.js + Express.js** – RESTful API development  
- **MongoDB + Mongoose** – NoSQL database with schema modeling  
- **JWT Authentication** – Secure user sessions  
- **Nodemon** – Hot reloading for development  

### 🔹 Frontend  
- **React.js** – Dynamic & responsive UI  
- **Bootstrap** – Modern styling framework  
- **Recharts** – Interactive data visualizations  
- **Fetch API / Axios** – For API requests  

---

## 📁 Project Structure  

expense-tracker/
├── backend/ # Express.js server
│ ├── models/ # MongoDB schemas
│ ├── routes/ # API endpoints
│ ├── middleware/ # JWT auth middleware
│ ├── server.js # Main server file
│ └── package.json # Backend dependencies
├── frontend/ # React application
│ ├── src/ # React components
│ ├── public/ # Static files
│ └── package.json # Frontend dependencies
└── README.md # Project documentation

yaml
Copy
Edit

---

## 🚀 Quick Start  

### 🔧 Prerequisites  
- Node.js (v14 or higher)  
- MongoDB installed & running  
- npm or yarn package manager  

---

### ▶ Backend Setup  

```bash
cd backend
npm install


### Create a .env file in backend/:

MONGODB_URI=mongodb://localhost:27017/expense-tracker
JWT_SECRET=your-secret-key-here
PORT=5000
## Run backend:
npm run dev
👉 Backend runs on: http://localhost:5000

## ▶Frontend Setup
bash
Copy
Edit
cd frontend
npm install
npm start
👉 Frontend runs on: http://localhost:3000
---

## 📚API Documentation
## 🔐Authentication
POST /auth/register → Register a new user

POST /auth/login → User login

## 💸Expenses
POST /expenses → Add expense

GET /expenses → Fetch all expenses

PUT /expenses/:id → Update expense

DELETE /expenses/:id → Delete expense

## 🎯Budget
POST /budget → Set/update monthly budget

GET /budget → Get budget usage

## 📊Analytics
GET /analytics/monthly → Monthly spending totals

GET /analytics/category → Category-wise breakdown

GET /analytics/alerts → Budget alerts


---
## 📷Screenshots
Here are some preview screenshots of the Expense Tracker:

### Dashboard

### Expense Management

### Analytics

👉 Place your screenshots inside a /screenshots folder in the root of the project.

## 🔐Environment Variables
Create a .env file in backend/ with:
MONGODB_URI=mongodb://localhost:27017/expense-tracker
JWT_SECRET=your-super-secret-jwt-key
PORT=5000
NODE_ENV=development

### 🧪Testing the API
You can test APIs using:

Postman
Insomnia
Thunder Client (VS Code extension)

### 🚀Deployment
Build the frontend:
cd frontend
npm run build

## Configure production .env

Deploy backend (Heroku / Render / DigitalOcean / AWS)

Serve frontend build files

## 🤝Contributing
Want to contribute? Awesome!

-Fork the repository

-Create a feature branch

-Commit your changes

-Push your branch

-Open a Pull Request

## 📄License
This project is licensed under the MIT License.[LICENSE]
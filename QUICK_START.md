# Quick Start Guide

## 🚀 Get Started in 5 Minutes

### Step 1: Prepare MongoDB
Make sure MongoDB is installed and running:
```bash
# Windows
mongod --dbpath "C:\path\to\data"

# macOS/Linux
mongod
```

### Step 2: Setup Backend

```bash
# Navigate to backend
cd backend

# Install dependencies
npm install

# Import sample data (make sure MongoDB is running)
mongoimport --uri "mongodb://localhost:27017/dashboard" --collection users --file data/users.json --jsonArray
mongoimport --uri "mongodb://localhost:27017/dashboard" --collection projects --file data/projects.json --jsonArray
mongoimport --uri "mongodb://localhost:27017/dashboard" --collection userprojects --file data/userProjects.json --jsonArray
mongoimport --uri "mongodb://localhost:27017/dashboard" --collection workunits --file data/workUnits.json --jsonArray
mongoimport --uri "mongodb://localhost:27017/dashboard" --collection tasks --file data/tasks.json --jsonArray
mongoimport --uri "mongodb://localhost:27017/dashboard" --collection comments --file data/comments.json --jsonArray
mongoimport --uri "mongodb://localhost:27017/dashboard" --collection attachments --file data/attachments.json --jsonArray

# Start backend server
npm start
# Server runs on http://localhost:5000
```

### Step 3: Setup Frontend (in new terminal)

```bash
# From root directory
npm install

# Start frontend dev server
npm run dev
# App runs on http://localhost:5173
```

### Step 4: Login
Open your browser and go to `http://localhost:5173`

Login with one of these accounts:
- **Admin**: admin@test.com / admin123
- **User**: john.doe@test.com / demo123
- **User**: jane.smith@test.com / demo123

## 📊 What You Get

✅ **11 Users** - Admin and multiple team members  
✅ **10 Projects** - Different methodologies (Agile, Kanban, Waterfall)  
✅ **11 Work Units** - Sprints, Columns, and Phases  
✅ **11 Tasks** - Various statuses and assignments  
✅ **11 Comments** - With threading support  
✅ **10 Attachments** - File references for tasks  

## 🔗 API Base URL
The frontend automatically connects to `http://localhost:5000/api`

To change this, edit `.env.local`:
```
VITE_API_BASE_URL=http://localhost:5000/api
```

## 📁 Project Methodologies

Projects are created with different management approaches:

1. **Agile** - Uses Sprints
   - Backlog
   - Sprint 1, Sprint 2, etc.

2. **Kanban** - Uses Columns
   - To Do
   - In Progress
   - Done

3. **Waterfall** - Uses Phases
   - Requirements
   - Design
   - Implementation
   - Testing
   - Deployment

## 🔒 Authentication

The app now uses a complete API-based authentication:
- No localStorage for sensitive data (uses sessionStorage for session)
- All credentials sent to backend for validation
- Sample users already in MongoDB

## 📝 Key Differences from Demo Version

✅ **No more localStorage** - All data persisted in MongoDB  
✅ **Real API calls** - Backend Express.js server  
✅ **Complete data** - 11 records in each of 7 tables  
✅ **Production ready** - Proper error handling and logging  
✅ **Scalable** - Ready for real deployment  

## 🛠️ Troubleshooting

**Backend won't start?**
```bash
# Check if port 5000 is in use
lsof -i :5000
# If port is in use, change PORT in backend/.env
```

**Frontend can't connect to API?**
```bash
# Check if backend is running on http://localhost:5000/api/health
curl http://localhost:5000/api/health
```

**MongoDB import fails?**
```bash
# Make sure MongoDB service is running
# Windows: net start MongoDB
# macOS: brew services start mongodb-community
# Linux: sudo systemctl start mongod
```

## 📚 Full Documentation

See `BACKEND_SETUP.md` for complete setup and API documentation.

## 💻 Technology Stack

**Frontend:**
- React 18 + TypeScript
- Vite
- Tailwind CSS + shadcn/ui
- React Router

**Backend:**
- Express.js
- MongoDB + Mongoose
- Node.js
- CORS enabled

---

**Happy coding! 🎉**

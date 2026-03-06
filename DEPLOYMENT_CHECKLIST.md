# ✅ Deployment Verification Checklist

Use this guide to verify that all files have been correctly updated to use backend APIs.

---

## 🔍 Frontend Files - All Using Backend APIs

### ✅ Auth Context
- File: `src/app/contexts/AuthContext.tsx`
- Checks: 
  - [ ] Login calls `POST /api/users/auth/login` ✅
  - [ ] Register calls `POST /api/users/auth/register` ✅
  - [ ] Session storage used (not localStorage) ✅

### ✅ Data Context  
- File: `src/app/contexts/DataContext.tsx`
- Checks:
  - [ ] Projects fetch from `/api/projects` ✅
  - [ ] Tasks fetch from `/api/tasks` ✅
  - [ ] Comments fetch from `/api/comments` ✅
  - [ ] Attachments fetch from `/api/attachments` ✅
  - [ ] Notifications fetch from `/api/notifications/user/:userId` ✅
  - [ ] Audit logs fetch from `/api/audit-logs` ✅
  - [ ] All CRUD operations call respective endpoints ✅
  - [ ] No localStorage for audit logs ✅

### ✅ Login Page
- File: `src/app/pages/guest/LoginPage.tsx`
- Checks:
  - [ ] Uses `useAuth()` hook ✅
  - [ ] Checks user.role for admin redirect ✅
  - [ ] No localStorage.getItem('currentUser') ✅

### ✅ Admin Pages
- Files:
  - `src/app/pages/admin/AdminDashboard.tsx` ✅
  - `src/app/pages/admin/AuditLogs.tsx` ✅
  - `src/app/pages/admin/UserManagement.tsx` ✅
  - `src/app/pages/admin/ProjectManagement.tsx` ✅
  - `src/app/pages/admin/SystemReports.tsx` ✅

- Checks:
  - [ ] AuditLogs uses `useData().auditLogs` ✅
  - [ ] Notifications page uses `useData().getUserNotifications()` ✅
  - [ ] All use API data from DataContext ✅

### ✅ User Pages
- Files:
  - `src/app/pages/user/Dashboard.tsx` ✅
  - `src/app/pages/user/ProjectList.tsx` ✅
  - `src/app/pages/user/ProjectDetail.tsx` ✅
  - `src/app/pages/user/TaskBoard.tsx` ✅
  - `src/app/pages/user/Reports.tsx` ✅
  - `src/app/pages/user/NotificationsPage.tsx` ✅
  - `src/app/pages/user/ProfilePage.tsx` ✅

- Checks:
  - [ ] All pages use `useAuth()` hook ✅
  - [ ] All pages use `useData()` hook ✅
  - [ ] All data comes from API ✅

---

## 🔨 Backend Files - New Collections Added

### ✅ Models Created
- [ ] `backend/models/AuditLog.js` ✅
- [ ] `backend/models/Notification.js` ✅

### ✅ Controllers Created
- [ ] `backend/controllers/auditLogController.js` ✅
- [ ] `backend/controllers/notificationController.js` ✅

### ✅ Routes Created
- [ ] `backend/routes/auditLogRoutes.js` ✅
- [ ] `backend/routes/notificationRoutes.js` ✅

### ✅ Server Updated
- File: `backend/server.js`
- Checks:
  - [ ] Imports auditLogRoutes ✅
  - [ ] Imports notificationRoutes ✅
  - [ ] Routes mounted at `/api/audit-logs` ✅
  - [ ] Routes mounted at `/api/notifications` ✅

---

## 📊 Sample Data Files

### ✅ Data Files Created
- [ ] `backend/data/auditLogs.json` (11 records) ✅
- [ ] `backend/data/notifications.json` (11 records) ✅

### ✅ All Data Files Present
- [ ] `backend/data/users.json` (11 records) ✅
- [ ] `backend/data/projects.json` (10 records) ✅
- [ ] `backend/data/userProjects.json` (11 records) ✅
- [ ] `backend/data/workUnits.json` (11 records) ✅
- [ ] `backend/data/tasks.json` (11 records) ✅
- [ ] `backend/data/comments.json` (11 records) ✅
- [ ] `backend/data/attachments.json` (10 records) ✅
- [ ] `backend/data/auditLogs.json` (11 records) ✅
- [ ] `backend/data/notifications.json` (11 records) ✅

**Total: 107 sample records ready for import**

---

## 🚀 Deployment Steps

### Step 1: Verify MongoDB is Running
```bash
# Check MongoDB service
mongo --version

# Start if not running
mongod

# Or on Windows
net start MongoDB
```

### Step 2: Import All Collections
```bash
cd backend

# Run all imports
mongoimport --uri "mongodb://localhost:27017/dashboard" --collection users --file data/users.json --jsonArray
mongoimport --uri "mongodb://localhost:27017/dashboard" --collection projects --file data/projects.json --jsonArray
mongoimport --uri "mongodb://localhost:27017/dashboard" --collection userprojects --file data/userProjects.json --jsonArray
mongoimport --uri "mongodb://localhost:27017/dashboard" --collection workunits --file data/workUnits.json --jsonArray
mongoimport --uri "mongodb://localhost:27017/dashboard" --collection tasks --file data/tasks.json --jsonArray
mongoimport --uri "mongodb://localhost:27017/dashboard" --collection comments --file data/comments.json --jsonArray
mongoimport --uri "mongodb://localhost:27017/dashboard" --collection attachments --file data/attachments.json --jsonArray
mongoimport --uri "mongodb://localhost:27017/dashboard" --collection auditlogs --file data/auditLogs.json --jsonArray
mongoimport --uri "mongodb://localhost:27017/dashboard" --collection notifications --file data/notifications.json --jsonArray
```

### Step 3: Verify Imports
```bash
mongosh dashboard

# Check counts
db.users.countDocuments()          # Should be 11
db.projects.countDocuments()       # Should be 10
db.userprojects.countDocuments()   # Should be 11
db.workunits.countDocuments()      # Should be 11
db.tasks.countDocuments()          # Should be 11
db.comments.countDocuments()       # Should be 11
db.attachments.countDocuments()    # Should be 10
db.auditlogs.countDocuments()      # Should be 11
db.notifications.countDocuments()  # Should be 11

# Total should be 107
```

### Step 4: Start Backend
```bash
# In backend directory
npm install    # if needed
npm start
# Should output: "Server is running on http://localhost:5000"
```

### Step 5: Start Frontend  
```bash
# In root directory (new terminal)
npm install    # if needed
npm run dev
# Should output: "http://localhost:5173"
```

### Step 6: Test Login
1. Open `http://localhost:5173`
2. Click "Login"
3. Enter credentials:
   - Email: `admin@test.com`
   - Password: `admin123`
4. Should redirect to `/admin` dashboard
5. All data should load from backend APIs

### Step 7: Verify Admin Pages
1. Go to Admin Dashboard
2. Check "Users" tab - should show 11 users from DB ✅
3. Check "Projects" tab - should show 10 projects from DB ✅
4. Check "Audit Logs" - should show 11 audit logs from DB ✅
5. Check "System Reports" - should show reports with DB data ✅

### Step 8: Verify User Pages
1. Login as regular user: `john.doe@test.com` / `demo123`
2. Dashboard - should show projects from DB ✅
3. Projects - should show list from DB ✅
4. Notifications - should show notifications from DB ✅
5. Tasks - should load from DB ✅
6. Comments - should display properly ✅

---

## 🔍 API Testing (Optional)

### Test Audit Logs API
```bash
# Get all audit logs
curl http://localhost:5000/api/audit-logs

# Get create actions only
curl http://localhost:5000/api/audit-logs/action/create
```

### Test Notifications API
```bash
# Get user notifications (replace with real userId)
curl http://localhost:5000/api/notifications/user/65f7d1a1c3d4e5f6g7h8i9j2

# Get unread notifications
curl http://localhost:5000/api/notifications/user/65f7d1a1c3d4e5f6g7h8i9j2/unread
```

---

## ✅ Verification Summary

- [ ] All 9 connections exist in backend
- [ ] All 9 routes are mounted
- [ ] All 9 data files are imported
- [ ] Frontend context calls all endpoints
- [ ] Admin pages show real data
- [ ] User pages show real data
- [ ] No localStorage for audit logs
- [ ] No localStorage for notifications
- [ ] Session storage for auth only
- [ ] All pages responsive and functional

---

## 🎉 Ready to Deploy!

Once all checks pass, your full-stack application is ready:

✅ **Backend**: Express + MongoDB with 9 complete endpoints collections
✅ **Frontend**: React consuming all backend APIs
✅ **Database**: MongoDB with 107 sample records
✅ **Data Flow**: Complete API-based architecture
✅ **Admin Features**: Audit logs and user management
✅ **User Features**: Notifications and task management

**Deploy with confidence!**

---

## 📞 Common Issues & Fixes

### "Cannot GET /api/audit-logs"
- Fix: Restart backend server
- Check: Verify routes are imported in server.js

### "Notifications not loading"
- Fix: Verify notifications.json was imported
- Check: `db.notifications.countDocuments()` in MongoDB

### "Audit logs showing empty"
- Fix: Verify auditLogs.json was imported
- Check: `db.auditlogs.countDocuments()` should be 11

### "Frontend not connecting to backend"
- Fix: Check .env.local has `VITE_API_BASE_URL=http://localhost:5000/api`
- Check: Backend is running on port 5000

---

## 📚 Documentation

- `INDEX.md` - Overview and quick start
- `QUICK_START.md` - 5-minute setup guide  
- `BACKEND_SETUP.md` - Detailed backend documentation
- `BACKEND_API_COMPLETE.md` - API update summary
- `MONGODB_IMPORT.md` - Import commands
- `ARCHITECTURE.md` - System architecture


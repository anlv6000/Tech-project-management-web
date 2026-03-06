# Troubleshooting Guide

## 🔧 Common Issues and Solutions

### MongoDB Issues

#### ❌ "MongoDB connection refused"
**Problem:** Backend can't connect to MongoDB
```
Error: connect ECONNREFUSED 127.0.0.1:27017
```

**Solution:**
1. Start MongoDB service:
   ```bash
   # Windows
   net start MongoDB
   # or in MongoDB installation dir
   mongod --dbpath "C:\data\db"
   
   # macOS
   brew services start mongodb-community
   
   # Linux
   sudo systemctl start mongod
   ```

2. Verify MongoDB is running:
   ```bash
   mongo --version
   mongosh
   ```

3. Check `.env` MongoDB URI matches your setup

#### ❌ "Database doesn't exist"
**Problem:** Import fails because database hasn't been created

**Solution:**
MongoDB auto-creates databases, but ensure collection names are lowercase:
```bash
mongoimport --uri "mongodb://localhost:27017/dashboard" \
  --collection users --file backend/data/users.json --jsonArray
```

#### ❌ "Invalid JSON in data file"
**Problem:** Import fails with JSON parse error

**Solution:**
1. Verify JSON is valid:
   ```bash
   # Use jq to validate
   jq . backend/data/users.json
   ```

2. Ensure ObjectId format is correct:
   ```json
   {"$oid": "507f1f77bcf86cd799439001"}
   ```

---

### Backend Issues

#### ❌ "Port 5000 already in use"
**Problem:**
```
Error: listen EADDRINUSE :::5000
```

**Solution:**
```bash
# Find process using port 5000
lsof -i :5000              # macOS/Linux
netstat -ano | grep 5000  # Windows

# Kill the process
kill -9 <PID>              # macOS/Linux
taskkill /PID <PID> /F    # Windows

# Or change port in backend/.env
PORT=5001
```

#### ❌ "npm install fails in backend"
**Problem:**
```
npm ERR! code ERESOLVE
```

**Solution:**
```bash
cd backend
npm install --legacy-peer-deps
# or
npm cache clean --force
npm install
```

#### ❌ "Backend starts but 404 on endpoints"
**Problem:** Routes not found

**Solution:**
1. Verify routes are imported in server.js:
   ```javascript
   app.use('/api/users', userRoutes);
   app.use('/api/projects', projectRoutes);
   // etc...
   ```

2. Check API endpoint format:
   ```
   GET http://localhost:5000/api/users
   NOT http://localhost:5000/users
   ```

3. Check CORS middleware is loaded before routes:
   ```javascript
   app.use(cors());
   app.use(express.json());
   // Then routes
   ```

#### ❌ "Cannot find module" error
**Problem:**
```
Error: Cannot find module 'express'
```

**Solution:**
1. Reinstall dependencies:
   ```bash
   rm -rf node_modules package-lock.json
   npm install
   ```

2. Verify backend/package.json has all dependencies

---

### Frontend Issues

#### ❌ "API calls fail with CORS error"
**Problem:**
```
Access to XMLHttpRequest blocked by CORS policy
```

**Solution:**
1. Verify backend has CORS enabled:
   ```javascript
   const cors = require('cors');
   app.use(cors());
   ```

2. Check `.env.local` has correct endpoint:
   ```
   VITE_API_BASE_URL=http://localhost:5000/api
   ```

3. Ensure backend is running before frontend

#### ❌ "getEnvironmentVariable is not a function" or undefined API URL
**Problem:** Vite not picking up .env.local

**Solution:**
1. Restart frontend dev server:
   ```bash
   npm run dev
   ```

2. Verify `.env.local` is in root directory:
   ```
   .env.local (in root, not in src/)
   VITE_API_BASE_URL=http://localhost:5000/api
   ```

3. Use `import.meta.env.VITE_API_BASE_URL` (not `process.env`)

#### ❌ "Login always fails"
**Problem:** Authentication doesn't work

**Solution:**
1. Verify sample data was imported to MongoDB:
   ```bash
   # In MongoDB shell
   db.users.find()
   ```

2. Check exact email/password from data file:
   - admin@test.com / admin123
   - john.doe@test.com / demo123

3. Check backend receives login request:
   ```bash
   # Add logs to userController.js
   console.log('Login attempt:', email);
   ```

4. Verify response format from API matches frontend expectations

#### ❌ "npm run dev fails"
**Problem:**
```
Error: Cannot find module 'vite'
```

**Solution:**
```bash
# In root directory (not backend)
npm install
npm run dev
```

---

### Frontend & Backend Communication

#### ❌ "Frontend doesn't see data after login"
**Problem:** Logged in but no projects/tasks appear

**Solution:**
1. Check network requests in DevTools:
   - Go to Network tab
   - Login and check API calls
   - Should see requests to `/api/projects`, `/api/tasks`, etc.

2. Verify data was imported:
   ```bash
   mongo dashboard
   > db.projects.count()  # Should show 10
   > db.tasks.count()     # Should show 11
   ```

3. Check DataContext useEffect runs on login:
   - Add console.log in useEffect
   - Verify it runs after user is authenticated

#### ❌ "Updates don't persist"
**Problem:** Changes appear locally but disappear on refresh

**Solution:**
1. Verify PUT/POST requests reach backend:
   - Check Network tab in DevTools
   - Look for 200-201 status codes

2. Check MongoDB actually updated:
   ```bash
   mongo dashboard
   > db.tasks.findOne({_id: ObjectId("...")})
   ```

3. Verify DataContext updates state after API response

#### ❌ "Create operations fail silently"
**Problem:** Form submits but nothing happens

**Solution:**
1. Check browser console for errors
2. Verify all required fields are provided:
   ```javascript
   // Example: createTask requires
   {
     projectId,
     workUnitId,
     title,
     description,
     createdBy
   }
   ```

3. Add error logging to DataContext:
   ```javascript
   catch (error) {
     console.error('Create error:', error);
   }
   ```

---

### Performance Issues

#### 🐢 "App is very slow"
**Solution:**
1. Check Network tab for slow requests
2. Optimize MongoDB queries:
   ```javascript
   // Add indexes to frequently queried fields
   userSchema.index({ email: 1 });
   ```

3. Implement pagination:
   ```javascript
   // Limit results
   Task.find().limit(50).skip(0)
   ```

#### 💾 "Memory usage increasing"
**Solution:**
1. Check for memory leaks in contexts
2. Ensure cleanup in useEffect:
   ```javascript
   useEffect(() => {
     return () => {
       // Cleanup
     };
   }, []);
   ```

---

### Production Deployment

#### ❌ "Can't connect to production MongoDB"
**Solution:**
1. Update `.env` with production URI:
   ```
   MONGODB_URI=mongodb+srv://user:password@cluster.mongodb.net/dashboard
   ```

2. Whitelist IP addresses in MongoDB Atlas
3. Use environment variables for secrets

#### ❌ "Frontend deployed but API unreachable"
**Solution:**
1. Update `.env.local` in deployed environment:
   ```
   VITE_API_BASE_URL=https://api.yourdomain.com/api
   ```

2. Verify backend API endpoint is accessible from frontend domain
3. Enable CORS for your domain:
   ```javascript
   app.use(cors({
     origin: 'https://yourdomainapi.com'
   }));
   ```

---

### Type Errors

#### ❌ "Property '_id' does not exist"
**Problem:** TypeScript error due to MongoDB _id

**Solution:**
```typescript
// Update types to support both id and _id
export interface User {
  id?: string;
  _id?: string;
  email: string;
  // ...
}

// When using:
const userId = user.id || user._id;
```

---

### Debugging Tips

#### 1. Check Backend Logs
```bash
# In backend/controllers/*.js
console.log('Creating project:', data);
console.log('Error:', error);
```

#### 2. Check Frontend Console
```javascript
// In browser DevTools Console
localStorage.getItem('currentUser')
sessionStorage.getItem('currentUser')
```

#### 3. Check Network Requests
1. Open DevTools → Network tab
2. Click request to see:
   - Request headers
   - Request body
   - Response status
   - Response body

#### 4. Check MongoDB Data
```bash
mongosh
> use dashboard
> db.users.findOne()
> db.projects.find().pretty()
> db.tasks.count()
```

#### 5. Test API Manually
```bash
# Test login
curl -X POST http://localhost:5000/api/users/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"admin@test.com","password":"admin123"}'

# Get projects
curl http://localhost:5000/api/projects
```

---

### Still Having Issues?

**Checklist:**
- ✅ MongoDB is running (`mongod` or service)
- ✅ Backend is running (`npm start` in backend/)
- ✅ Frontend dev server running (`npm run dev` in root/)
- ✅ Sample data imported to MongoDB
- ✅ `.env.local` has correct API URL
- ✅ No port conflicts (5000, 5173)
- ✅ Network requests visible in DevTools
- ✅ No CORS errors in browser console

**If still stuck:**
1. Clear browser cache and localStorage
2. Hard refresh (Ctrl+Shift+R or Cmd+Shift+R)
3. Restart all servers
4. Check logs for specific error messages
5. Review the specific error in DevTools Console

---

**Last Resort: Nuclear Option**
```bash
# Clean everything and restart
# 1. Stop all servers (Ctrl+C)

# 2. Frontend
rm -rf node_modules package-lock.json
npm install
npm run dev

# 3. Backend (in new terminal)
cd backend
rm -rf node_modules package-lock.json
npm install

# 4. MongoDB (in new terminal)
mongod

# 5. Re-import data
mongoimport --uri "mongodb://localhost:27017/dashboard" \
  --collection users --file backend/data/users.json --jsonArray
# ... (repeat for all collections)

# 6. Start backend
npm start

# 7. Login with admin@test.com / admin123
```

Good luck! 🚀

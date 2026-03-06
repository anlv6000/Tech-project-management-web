# User Authentication and Dashboard - Full Stack Setup

This project includes both frontend (React + Vite) and backend (Express.js + MongoDB) applications that work together to provide a complete project management system with user authentication.

## Project Structure

```
├── src/                          # Frontend (React/Vite)
│   ├── app/
│   │   ├── components/           # UI components
│   │   ├── contexts/             # AuthContext, DataContext (now API-based)
│   │   ├── pages/                # Page components
│   │   ├── App.tsx
│   │   ├── types.ts              # Type definitions
│   │   └── routes.ts
│   ├── main.tsx
│   └── styles/
├── backend/                      # Express.js API
│   ├── models/                   # MongoDB models
│   ├── controllers/              # Business logic
│   ├── routes/                   # API endpoints
│   ├── data/                     # Sample JSON data for import
│   ├── server.js                 # Express app setup
│   ├── package.json
│   └── .env                      # Configuration
├── .env.local                    # Frontend API configuration
├── package.json                  # Frontend dependencies
└── README.md
```

## Backend Setup

### Prerequisites
- Node.js (v16 or higher)
- MongoDB (local or MongoDB Atlas)

### Installation Steps

1. **Navigate to backend directory**
   ```bash
   cd backend
   ```

2. **Install dependencies**
   ```bash
   npm install
   ```

3. **Configure environment variables**
   
   Update `backend/.env`:
   ```
   MONGODB_URI=mongodb://localhost:27017/dashboard
   PORT=5000
   NODE_ENV=development
   JWT_SECRET=your_jwt_secret_key_change_this_in_production
   ```

4. **Import Sample Data to MongoDB**

   Use MongoDB Atlas or MongoDB Compass to import the JSON files:
   
   - Database: `dashboard`
   - Collections to create:
     - `users` (import from `data/users.json`)
     - `projects` (import from `data/projects.json`)
     - `userprojects` (import from `data/userProjects.json`)
     - `workunits` (import from `data/workUnits.json`)
     - `tasks` (import from `data/tasks.json`)
     - `comments` (import from `data/comments.json`)
     - `attachments` (import from `data/attachments.json`)

   **Using MongoDB CLI:**
   ```bash
   mongoimport --uri "mongodb://localhost:27017/dashboard" --collection users --file data/users.json --jsonArray
   mongoimport --uri "mongodb://localhost:27017/dashboard" --collection projects --file data/projects.json --jsonArray
   mongoimport --uri "mongodb://localhost:27017/dashboard" --collection userprojects --file data/userProjects.json --jsonArray
   mongoimport --uri "mongodb://localhost:27017/dashboard" --collection workunits --file data/workUnits.json --jsonArray
   mongoimport --uri "mongodb://localhost:27017/dashboard" --collection tasks --file data/tasks.json --jsonArray
   mongoimport --uri "mongodb://localhost:27017/dashboard" --collection comments --file data/comments.json --jsonArray
   mongoimport --uri "mongodb://localhost:27017/dashboard" --collection attachments --file data/attachments.json --jsonArray
   ```

5. **Start the backend server**
   ```bash
   npm start
   # or for development with auto-reload:
   npm run dev
   ```

   Server will run on `http://localhost:5000`

## Frontend Setup

### Prerequisites
- Node.js (v16 or higher)

### Installation Steps

1. **Navigate to root directory** (if not already there)
   ```bash
   cd ..
   ```

2. **Install dependencies**
   ```bash
   npm install
   ```

3. **Configure API endpoint**
   
   Update `.env.local`:
   ```
   VITE_API_BASE_URL=http://localhost:5000/api
   ```

4. **Start the development server**
   ```bash
   npm run dev
   ```

   Frontend will run on `http://localhost:5173`

## API Endpoints

### Users
- `GET /api/users` - Get all users
- `GET /api/users/:id` - Get user by ID
- `POST /api/users` - Create new user
- `POST /api/users/auth/login` - Login user
- `POST /api/users/auth/register` - Register new user
- `PUT /api/users/:id` - Update user
- `DELETE /api/users/:id` - Delete user

### Projects
- `GET /api/projects` - Get all projects
- `GET /api/projects/:id` - Get project by ID
- `GET /api/projects/user/:userId` - Get user's projects
- `POST /api/projects` - Create new project
- `PUT /api/projects/:id` - Update project
- `DELETE /api/projects/:id` - Delete project

### UserProjects
- `GET /api/user-projects/project/:projectId` - Get project members
- `POST /api/user-projects` - Add user to project
- `PUT /api/user-projects/:userId/:projectId` - Update user role
- `DELETE /api/user-projects/:userId/:projectId` - Remove user from project

### WorkUnits
- `GET /api/work-units/project/:projectId` - Get project work units
- `GET /api/work-units/:id` - Get work unit by ID
- `POST /api/work-units` - Create work unit
- `PUT /api/work-units/:id` - Update work unit
- `DELETE /api/work-units/:id` - Delete work unit

### Tasks
- `GET /api/tasks/project/:projectId` - Get project tasks
- `GET /api/tasks/workunit/:workUnitId` - Get work unit tasks
- `GET /api/tasks/:id` - Get task by ID
- `POST /api/tasks` - Create task
- `PUT /api/tasks/:id` - Update task
- `DELETE /api/tasks/:id` - Delete task

### Comments
- `GET /api/comments/task/:taskId` - Get task comments
- `GET /api/comments/:id` - Get comment by ID
- `POST /api/comments` - Create comment
- `PUT /api/comments/:id` - Update comment
- `DELETE /api/comments/:id` - Delete comment

### Attachments
- `GET /api/attachments/task/:taskId` - Get task attachments
- `GET /api/attachments/:id` - Get attachment by ID
- `POST /api/attachments` - Upload attachment
- `DELETE /api/attachments/:id` - Delete attachment

## Sample Login Credentials

After importing data, you can login with:

```
Email: admin@test.com
Password: admin123
Role: Admin

OR

Email: john.doe@test.com
Password: demo123
Role: User

OR

Email: jane.smith@test.com
Password: demo123
Role: User
```

## Database Schema

### 7 Core Tables

1. **User** - Stores identity, account credentials, and profile information
2. **Project** - Centralized workspace representing a specific goal or initiative
3. **UserProject** - Junction table linking User ↔ Project with roles
4. **WorkUnit** - Work management unit within a Project (Sprint, Phase, Column, etc.)
5. **Task** - Smallest unit of work with title, description, priority, status
6. **Comment** - Textual interactions attached to a Task
7. **Attachment** - Files or documents uploaded and linked to a Task

## Key Features

✅ Complete user authentication system
✅ Project management with multiple methodologies (Agile, Kanban, Waterfall)
✅ Role-based access control (Admin, Manager, Member, Viewer)
✅ Task management with status tracking
✅ Comment system for collaboration
✅ File attachments for tasks
✅ Comprehensive audit logging
✅ Responsive UI with shadcn/ui components
✅ Real-time data fetching from API

## Development

### Frontend Build
```bash
npm run build
```

### Backend Production
```bash
npm start
```

## Troubleshooting

### Backend Connection Issues
- Ensure MongoDB is running: `mongod`
- Check if port 5000 is not in use: `netstat -an | grep 5000`
- Verify `.env` configuration

### Frontend API Errors
- Check `.env.local` has correct `VITE_API_BASE_URL`
- Ensure backend is running on port 5000
- Check browser console for CORS errors

### Data Import Issues
- Ensure MongoDB database `dashboard` exists
- Verify JSON files are valid (use tools like jsonlint)
- Check MongoDB permissions

## Technologies Used

**Frontend:**
- React 18
- TypeScript
- Vite
- Tailwind CSS
- shadcn/ui
- React Router
- React Hook Form

**Backend:**
- Express.js
- MongoDB & Mongoose
- Node.js
- CORS
- dotenv

## License

This project is provided as-is for educational and development purposes.

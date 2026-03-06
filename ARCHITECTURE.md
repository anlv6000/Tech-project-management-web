# Architecture Overview

## System Architecture

```
┌─────────────────────────────────────────────────────────────────┐
│                      USER BROWSER                               │
│                  (http://localhost:5173)                         │
└────────────────┬────────────────────────────────────────────────┘
                 │
                 │ HTTP/REST
                 │
┌────────────────┴────────────────────────────────────────────────┐
│              FRONTEND (React + Vite)                             │
├─────────────────────────────────────────────────────────────────┤
│  - App.tsx (Router)                                             │
│  - AuthContext (API-based authentication)                       │
│  - DataContext (API-based CRUD operations)                      │
│  - Pages (Dashboard, Projects, Tasks, etc.)                     │
│  - Components (UI with shadcn/ui)                               │
│  - .env.local (API_BASE_URL = http://localhost:5000/api)       │
└────────────────┬────────────────────────────────────────────────┘
                 │
                 │ REST API Calls
                 │ (JSON over HTTP)
                 │
┌────────────────┴────────────────────────────────────────────────┐
│           BACKEND (Express.js + Node.js)                         │
│           (http://localhost:5000)                                │
├─────────────────────────────────────────────────────────────────┤
│                                                                  │
│  ┌──────────────────────────────────────────────────────────┐   │
│  │               API Routes                                 │   │
│  ├──────────────────────────────────────────────────────────┤   │
│  │ GET/POST/PUT/DELETE /api/users                           │   │
│  │ GET/POST/PUT/DELETE /api/projects                        │   │
│  │ GET/POST/PUT/DELETE /api/user-projects                   │   │
│  │ GET/POST/PUT/DELETE /api/work-units                      │   │
│  │ GET/POST/PUT/DELETE /api/tasks                           │   │
│  │ GET/POST/PUT/DELETE /api/comments                        │   │
│  │ GET/POST/PUT/DELETE /api/attachments                     │   │
│  └──────────────────────────────────────────────────────────┘   │
│           ↓                                                      │
│  ┌──────────────────────────────────────────────────────────┐   │
│  │          Controllers (Business Logic)                    │   │
│  ├──────────────────────────────────────────────────────────┤   │
│  │ userController      workUnitController                   │   │
│  │ projectController   taskController                       │   │
│  │ userProjectCtrl     commentController                    │   │
│  │ attachmentController                                     │   │
│  └──────────────────────────────────────────────────────────┘   │
│           ↓                                                      │
│  ┌──────────────────────────────────────────────────────────┐   │
│  │          MongoDB Models (Mongoose)                       │   │
│  ├──────────────────────────────────────────────────────────┤   │
│  │ User    Project    UserProject    WorkUnit               │   │
│  │ Task    Comment    Attachment                            │   │
│  └──────────────────────────────────────────────────────────┘   │
│                                                                  │
└────────────────┬────────────────────────────────────────────────┘
                 │
                 │ Database Queries
                 │ (Mongoose/MongoDB)
                 │
┌────────────────┴────────────────────────────────────────────────┐
│                MongoDB Database                                  │
│           (mongodb://localhost:27017/dashboard)                  │
├─────────────────────────────────────────────────────────────────┤
│                                                                  │
│  ┌─────────────┐  ┌──────────────┐  ┌─────────────────┐        │
│  │   users     │  │  projects    │  │  userprojects   │        │
│  │  (11 docs)  │  │  (10 docs)   │  │   (11 docs)     │        │
│  └─────────────┘  └──────────────┘  └─────────────────┘        │
│                                                                  │
│  ┌─────────────┐  ┌──────────────┐  ┌─────────────────┐        │
│  │  workunits  │  │    tasks     │  │   comments      │        │
│  │  (11 docs)  │  │  (11 docs)   │  │   (11 docs)     │        │
│  └─────────────┘  └──────────────┘  └─────────────────┘        │
│                                                                  │
│  ┌─────────────┐                                                │
│  │ attachments │                                                │
│  │  (10 docs)  │                                                │
│  └─────────────┘                                                │
│                                                                  │
└─────────────────────────────────────────────────────────────────┘
```

## Data Flow Diagram

### Authentication Flow
```
User Login Form
     ↓
AuthContext.login()
     ↓
POST /api/users/auth/login (email, password)
     ↓
Backend validates credentials
     ↓
Returns User object + token
     ↓
Store in sessionStorage
     ↓
User authenticated ✅
```

### Data Fetch Flow
```
Component mounts
     ↓
useData() hook
     ↓
DataContext.getProjectsByUser()
     ↓
GET /api/projects/user/:userId
     ↓
Backend queries MongoDB
     ↓
Returns Project array
     ↓
setState(projects)
     ↓
Component re-renders with data ✅
```

### Create Operation Flow
```
User submits form
     ↓
DataContext.createProject()
     ↓
POST /api/projects (data)
     ↓
Controller validates input
     ↓
Create document in MongoDB
     ↓
Return new Project object
     ↓
useState updates projects array
     ↓
UI reflects new project ✅
```

### Update Operation Flow
```
User edits and saves
     ↓
DataContext.updateTask()
     ↓
PUT /api/tasks/:id (updates)
     ↓
Controller finds document
     ↓
Update fields in MongoDB
     ↓
Return updated Task object
     ↓
useState updates tasks array
     ↓
UI shows updated task ✅
```

## Database Schema Relationships

```
  ┌──────────────┐
  │    User      │
  └──────────────┘
        ||
        || (many-to-many)
        ||
  ┌──────────────────────┐
  │  UserProject (JWT)   │
  └──────────────────────┘
        ||
        || (one-to-many)
        ||
  ┌──────────────────────┐
  │    Project           │
  └──────────────────────┘
        ||
        || (one-to-many)
        ||┌─────────────────────┐
         ├→ WorkUnit (Sprint)   │
         │ WorkUnit (Column)    │
         │ WorkUnit (Phase)     │
         └─────────────────────┘
            ||
            || (one-to-many)
            ||
        ┌───────────┐
        │   Task    │
        └───────────┘
         /         \
        / (many)    \ (many)
       /             \
┌─────────────┐  ┌─────────────────┐
│  Comment    │  │  Attachment     │
└─────────────┘  └─────────────────┘
```

## Project Methodologies Support

```
Agile Projects
├── Backlog (Sprint, order: 0)
├── Sprint 1 (Sprint, order: 1)
├── Sprint 2 (Sprint, order: 2)
└── Sprint N (Sprint, order: N)

Kanban Projects
├── To Do (Column, order: 1)
├── In Progress (Column, order: 2)
└── Done (Column, order: 3)

Waterfall Projects
├── Requirements (Phase, order: 1)
├── Design (Phase, order: 2)
├── Implementation (Phase, order: 3)
├── Testing (Phase, order: 4)
└── Deployment (Phase, order: 5)
```

## Role-Based Access Control

```
User Roles:
├── Admin
│   ├── Full system access
│   ├── Manage all users
│   ├── View all projects
│   └── System administration
│
└── User
    ├── Create projects
    ├── Access assigned projects
    ├── Create tasks
    └── Collaborate on projects

Project Roles:
├── Admin
│   ├── Manage project settings
│   ├── Manage team members
│   ├── Delete project
│   └── Full project control
│
├── Manager
│   ├── Create work units
│   ├── Assign tasks
│   ├── View reports
│   └── Manage team
│
├── Member
│   ├── Create tasks
│   ├── Comment
│   ├── Upload attachments
│   └── Update own assignments
│
└── Viewer
    ├── View projects
    ├── View tasks
    └── Read-only access
```

## File Structure

```
User Authentication and Dashboard/
│
├── backend/                          # Express.js Backend
│   ├── models/                       # Mongoose Models
│   │   ├── User.js
│   │   ├── Project.js
│   │   ├── UserProject.js
│   │   ├── WorkUnit.js
│   │   ├── Task.js
│   │   ├── Comment.js
│   │   └── Attachment.js
│   │
│   ├── controllers/                  # Business Logic
│   │   ├── userController.js
│   │   ├── projectController.js
│   │   ├── userProjectController.js
│   │   ├── workUnitController.js
│   │   ├── taskController.js
│   │   ├── commentController.js
│   │   └── attachmentController.js
│   │
│   ├── routes/                       # API Routes
│   │   ├── userRoutes.js
│   │   ├── projectRoutes.js
│   │   ├── userProjectRoutes.js
│   │   ├── workUnitRoutes.js
│   │   ├── taskRoutes.js
│   │   ├── commentRoutes.js
│   │   └── attachmentRoutes.js
│   │
│   ├── data/                         # Sample Data (JSON)
│   │   ├── users.json
│   │   ├── projects.json
│   │   ├── userProjects.json
│   │   ├── workUnits.json
│   │   ├── tasks.json
│   │   ├── comments.json
│   │   └── attachments.json
│   │
│   ├── server.js                     # Express App Entry
│   ├── package.json
│   ├── .env                          # Backend Config
│   └── .gitignore
│
├── src/                              # React Frontend
│   ├── app/
│   │   ├── components/               # UI Components
│   │   ├── contexts/                 # API-based Contexts
│   │   │   ├── AuthContext.tsx       # Auth API Calls
│   │   │   └── DataContext.tsx       # Data API Calls
│   │   ├── pages/                    # Page Components
│   │   ├── App.tsx
│   │   ├── types.ts                  # Type Definitions
│   │   └── routes.ts
│   ├── main.tsx
│   └── styles/
│
├── .env.local                        # Frontend Config
├── .gitignore
├── package.json                      # Frontend Dependencies
├── vite.config.ts
├── QUICK_START.md                    # Quick Setup Guide
├── BACKEND_SETUP.md                  # Detailed Backend Docs
└── PROJECT_COMPLETION.md             # Completion Summary
```

---

This architecture provides a scalable, maintainable, and production-ready full-stack application with proper separation of concerns.

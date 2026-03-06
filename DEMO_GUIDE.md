# ProjectFlow - Demo Guide

## Demo Accounts

### User Account
- **Email:** john@demo.com
- **Password:** demo123
- Access to user dashboard, projects, and tasks

### Admin Account
- **Email:** admin@demo.com
- **Password:** admin123
- Full admin access to user management, system reports, and audit logs

### Additional User
- **Email:** jane@demo.com
- **Password:** demo123

## Features Overview

### Guest Area (Public)
- **Landing Page** - Marketing homepage with features and call-to-action
- **Register** - Create new account with validation
- **Login** - Authenticate users
- **Forgot Password** - Password reset flow with OTP (demo OTP: 123456)

### User Area (Authenticated Users)
- **Dashboard** - Overview of projects, tasks, and recent activity
- **Projects** - Create and manage projects with 3 methodologies:
  - **Agile (Scrum)** - Sprint-based workflow with backlog
  - **Kanban** - Continuous flow with customizable columns
  - **Waterfall** - Phase-based sequential workflow
- **Task Board** - Drag & drop Kanban board for task management
  - Task details with description, assignee, status
  - Comments and discussions
  - Attachments
  - Time tracking
- **Reports** - Burndown charts, status distribution, and analytics
- **Notifications** - Activity notifications
- **Profile** - Edit profile and change password

### Admin Area
- **Admin Dashboard** - System overview and statistics
- **User Management** - View, activate/deactivate users
- **Project Management** - View all projects, archive projects
- **System Reports** - Global analytics and trends
- **Audit Logs** - Track all system activities

## Project Methodologies

### Agile (Scrum)
- Work Units = Sprints
- Includes Backlog for future tasks
- Sprint planning and goals
- Burndown charts and velocity tracking

### Kanban
- Work Units = Columns (To Do, In Progress, Done)
- Continuous workflow
- Drag and drop tasks between columns
- Cumulative flow visualization

### Waterfall
- Work Units = Phases (Requirements, Design, Implementation, Testing, Deployment)
- Sequential workflow
- Gantt chart view
- Milestone tracking

## Key Features

✅ **7 Database Tables** - User, Project, UserProject, WorkUnit, Task, Comment, Attachment
✅ **Role-Based Access** - User vs Admin permissions
✅ **Drag & Drop** - Task board with react-dnd
✅ **Charts & Analytics** - Using recharts library
✅ **Responsive Design** - Mobile and desktop optimized
✅ **Local Storage** - Data persists across sessions
✅ **Form Validation** - Inline error messages
✅ **Mock Data** - Pre-loaded demo projects and tasks

## Technology Stack

- React 18 with TypeScript
- React Router 7 (Data mode)
- Tailwind CSS v4
- React DnD (Drag and Drop)
- Recharts (Charts)
- Lucide React (Icons)
- LocalStorage (Data Persistence)

## Usage Tips

1. **Login as User** - Explore project boards and task management
2. **Create a New Project** - Choose different methodologies to see how UI adapts
3. **Drag Tasks** - Move tasks between columns on the task board
4. **Add Comments** - Collaborate on tasks with comments
5. **Login as Admin** - Manage users and view system-wide reports
6. **Track Time** - Log time spent on tasks
7. **View Reports** - Analyze project progress with charts

Enjoy exploring ProjectFlow! 🚀

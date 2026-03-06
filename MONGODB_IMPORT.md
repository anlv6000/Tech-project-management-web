# MongoDB Import Commands - Complete

Import all 9 collections into MongoDB with the following commands:

## Run all imports at once:

```bash
mongoimport --uri "mongodb://localhost:27017/dashboard" --collection users --file backend/data/users.json --jsonArray
mongoimport --uri "mongodb://localhost:27017/dashboard" --collection projects --file backend/data/projects.json --jsonArray
mongoimport --uri "mongodb://localhost:27017/dashboard" --collection userprojects --file backend/data/userProjects.json --jsonArray
mongoimport --uri "mongodb://localhost:27017/dashboard" --collection workunits --file backend/data/workUnits.json --jsonArray
mongoimport --uri "mongodb://localhost:27017/dashboard" --collection tasks --file backend/data/tasks.json --jsonArray
mongoimport --uri "mongodb://localhost:27017/dashboard" --collection comments --file backend/data/comments.json --jsonArray
mongoimport --uri "mongodb://localhost:27017/dashboard" --collection attachments --file backend/data/attachments.json --jsonArray
mongoimport --uri "mongodb://localhost:27017/dashboard" --collection auditlogs --file backend/data/auditLogs.json --jsonArray
mongoimport --uri "mongodb://localhost:27017/dashboard" --collection notifications --file backend/data/notifications.json --jsonArray
```

## Collections imported:
- ✅ users (11 records)
- ✅ projects (10 records)
- ✅ userprojects (11 records)
- ✅ workunits (11 records)
- ✅ tasks (11 records)
- ✅ comments (11 records)
- ✅ attachments (10 records)
- ✅ auditlogs (11 records) - NEW
- ✅ notifications (11 records) - NEW

**Total: 97 records across 9 collections**

## Verify imports:

```bash
mongosh dashboard

# Check each collection
db.users.countDocuments()          # Should show 11
db.projects.countDocuments()       # Should show 10
db.userprojects.countDocuments()   # Should show 11
db.workunits.countDocuments()      # Should show 11
db.tasks.countDocuments()          # Should show 11
db.comments.countDocuments()       # Should show 11
db.attachments.countDocuments()    # Should show 10
db.auditlogs.countDocuments()      # Should show 11 (NEW)
db.notifications.countDocuments()  # Should show 11 (NEW)
```

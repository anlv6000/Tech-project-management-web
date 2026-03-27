import cron from "node-cron";
import Project from "../models/Project.js";
import WorkUnit from "../models/WorkUnit.js";
import Task from "../models/Task.js";
import UserProject from "../models/UserProject.js";
import Notification from "../models/Notification.js";

// Cron job chạy mỗi ngày lúc 0h
cron.schedule("0 0 * * *", async () => {
  const now = new Date();

  // 1. Check project overdue
  const overdueProjects = await Project.find({
    endDate: { $lt: now },
    isCompleted: false,
  });

  for (const project of overdueProjects) {
    const members = await UserProject.find({ projectId: project._id });
    for (const member of members) {
      const notification = new Notification({
        userId: member.userId,
        type: "project",
        title: `Project overdue: ${project.name}`,
        message: `Project "${project.name}" has passed its end date.`,
        data: { projectId: project._id, status: "overdue" },
        isRead: false,
      });
      console.log(`[CronJob] Notification for user ${member.userId} on project ${project.name}`);
      await notification.save();
    }
  }

  // 2. Check workUnit overdue
  const overdueUnits = await WorkUnit.find({
    endDate: { $lt: now },
    isDone: false,
  });

  for (const wu of overdueUnits) {
    const members = await UserProject.find({ projectId: wu.projectId });
    for (const member of members) {
      const notification = new Notification({
        userId: member.userId,
        type: "workunit", 
        title: `WorkUnit overdue: ${wu.name}`,
        message: `WorkUnit "${wu.name}" in project ${wu.projectId} has passed its end date.`,
        data: { workUnitId: wu._id, projectId: wu.projectId, status: "overdue" },
        isRead: false,
      });
      console.log(`[CronJob] Notification for user ${member.userId} on workUnit ${wu.name}`);
      await notification.save();
    }
  }

  // 3. Check task overdue
  const overdueTasks = await Task.find({
    deadline: { $lt: now },
    status: { $ne: "done" },
  });

  for (const task of overdueTasks) {
    const members = await UserProject.find({ projectId: task.projectId });
    for (const member of members) {
      const notification = new Notification({
        userId: member.userId,
        type: "task",
        title: `Task overdue: ${task.title}`,
        message: `Task "${task.title}" thuộc project ${task.projectId} đã quá hạn.`,
        data: { taskId: task._id, projectId: task.projectId, workUnitId: task.workUnitId, status: "overdue" },
        isRead: false,
      });
      console.log(`[CronJob] Notification for user ${member.userId} on task ${task.title}`);
      await notification.save();
    }
  }
});

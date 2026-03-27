import React, { useEffect, useState } from "react";
import { Plus, X } from "lucide-react";
import { Task, ProjectRole } from "../../types";
import { API_BASE_URL } from "../../config/baseApi";
import { canEditTask } from "../../pages/user/permissions";
const getAuthJsonHeaders = () => {
  const token = sessionStorage.getItem("token");
  return {
    "Content-Type": "application/json",
    ...(token ? { Authorization: `Bearer ${token}` } : {}),
  };
};

const normalizeId = (id: any): string => {
  if (!id) return "";
  if (typeof id === "object" && id._id) return String(id._id);
  if (typeof id === "object" && id.id) return String(id.id);
  return String(id);
};

type RelationType = "relates_to" | "blocks" | "blocked_by" | "duplicates";

const RELATION_TYPE_LABELS: Record<RelationType, string> = {
  relates_to: "Relates to",
  blocks: "Blocks",
  blocked_by: "Blocked by",
  duplicates: "Duplicates",
};

const RELATION_TYPE_COLORS: Record<RelationType, string> = {
  blocks: "bg-red-100 text-red-700",
  blocked_by: "bg-orange-100 text-orange-700",
  relates_to: "bg-blue-100 text-blue-700",
  duplicates: "bg-gray-100 text-gray-600",
};

const STATUS_COLORS: Record<string, string> = {
  done: "bg-green-100 text-green-700",
  "in-progress": "bg-yellow-100 text-yellow-700",
  todo: "bg-gray-100 text-gray-600",
};

interface RelatedTasksProps {
  selectedTask: Task;
  projectId: string;
  isProjectCompleted: boolean;
  currentProjectRole: ProjectRole | undefined;
  currentUserId: string;
  getTasksByProject: (projectId: string) => Task[];
  onRelatedTaskClick: (task: Task) => void;
}

export default function RelatedTasks({
  selectedTask,
  projectId,
  isProjectCompleted,
  currentProjectRole,
  currentUserId,
  getTasksByProject,
  onRelatedTaskClick,
}: RelatedTasksProps) {
  const [relatedTasks, setRelatedTasks] = useState<any[]>([]);
  const [showAddRelated, setShowAddRelated] = useState(false);
  const [relatedSearch, setRelatedSearch] = useState("");
  const [relatedType, setRelatedType] = useState<RelationType>("relates_to");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const taskId = normalizeId(selectedTask.id || selectedTask._id);

  useEffect(() => {
    if (!taskId) return;
    loadRelatedTasks();
  }, [taskId]);

  const loadRelatedTasks = async () => {
    try {
      const res = await fetch(`${API_BASE_URL}/api/tasks/${taskId}/related`);
      if (!res.ok) throw new Error("Failed to load");
      const data = await res.json();
      setRelatedTasks(data);
    } catch {
      setRelatedTasks([]);
    }
  };

  const handleAddRelatedTask = async (targetTaskId: string) => {
    setLoading(true);
    setError("");
    try {
      const res = await fetch(`${API_BASE_URL}/api/tasks/${taskId}/related`, {
        method: "POST",
        headers: getAuthJsonHeaders(),
        body: JSON.stringify({ relatedTaskId: targetTaskId, type: relatedType }),
      });

      if (!res.ok) {
        const err = await res.json();
        setError(err.message || "Failed to add relation");
        return;
      }

      const updated = await res.json();
      setRelatedTasks(updated);
      setShowAddRelated(false);
      setRelatedSearch("");
      setError("");
    } catch {
      setError("Failed to add related task");
    } finally {
      setLoading(false);
    }
  };

  const handleRemoveRelatedTask = async (relatedTaskId: string) => {
    try {
      const res = await fetch(
        `${API_BASE_URL}/api/tasks/${taskId}/related/${relatedTaskId}`,
        {
          method: "DELETE",
          headers: getAuthJsonHeaders(),
        }
      );
      if (!res.ok) throw new Error("Failed to remove");
      setRelatedTasks((prev) =>
        prev.filter(
          (r) =>
            normalizeId(r.taskId?._id || r.taskId?.id || r.taskId) !==
            relatedTaskId
        )
      );
    } catch {
      setError("Failed to remove relation");
    }
  };

  const handleCloseAddPanel = () => {
    setShowAddRelated(false);
    setRelatedSearch("");
    setError("");
  };

  const canEdit =
    !!currentProjectRole &&
    canEditTask(selectedTask, currentProjectRole, currentUserId);

  const alreadyLinkedIds = new Set([
    taskId,
    ...relatedTasks.map((r) =>
      normalizeId(r.taskId?._id || r.taskId?.id || r.taskId)
    ),
  ]);

  const searchResults =
    relatedSearch.trim().length > 0
      ? getTasksByProject(projectId)
          .filter(
            (t: Task) =>
              String(t.projectId) === String(projectId) &&
              t.title.toLowerCase().includes(relatedSearch.toLowerCase()) &&
              !alreadyLinkedIds.has(normalizeId(t.id || t._id))
          )
          .slice(0, 8)
      : [];

  return (
    <div>
      <div className="flex items-center justify-between mb-3">
        <h3 className="font-medium text-gray-900">
          Related Tasks ({relatedTasks.length})
        </h3>

        {!isProjectCompleted && canEdit && (
          <button
            onClick={() => setShowAddRelated((prev) => !prev)}
            className="flex items-center gap-1 text-sm text-blue-600 hover:text-blue-800"
          >
            <Plus className="w-4 h-4" />
            Add relation
          </button>
        )}
      </div>

      {/* Relation list */}
      <div className="space-y-2">
        {relatedTasks.length === 0 && (
          <p className="text-sm text-gray-400 italic">No related tasks</p>
        )}

        {relatedTasks.map((rel) => {
          const relTask = rel.taskId;
          const relId = normalizeId(
            relTask?._id || relTask?.id || rel.taskId
          );
          const relType = rel.type as RelationType;

          return (
            <div
              key={relId}
              className="flex items-center gap-3 p-2 border border-gray-200 rounded-lg hover:bg-gray-50"
            >
              <span
                className={`text-xs px-2 py-0.5 rounded-full font-medium flex-shrink-0 ${
                  RELATION_TYPE_COLORS[relType] ?? RELATION_TYPE_COLORS.relates_to
                }`}
              >
                {RELATION_TYPE_LABELS[relType] ?? relType}
              </span>

              <span
                onClick={() => relTask && onRelatedTaskClick(relTask)}
                className="flex-1 text-sm text-gray-700 cursor-pointer hover:text-blue-600 hover:underline truncate"
              >
                {relTask?.title ?? "Unknown task"}
              </span>

              <span
                className={`text-xs px-2 py-0.5 rounded-full flex-shrink-0 ${
                  STATUS_COLORS[relTask?.status] ?? STATUS_COLORS.todo
                }`}
              >
                {relTask?.status ?? "—"}
              </span>

              {!isProjectCompleted && canEdit && (
                <button
                  onClick={() => handleRemoveRelatedTask(relId)}
                  className="text-gray-400 hover:text-red-500 flex-shrink-0"
                >
                  <X className="w-4 h-4" />
                </button>
              )}
            </div>
          );
        })}
      </div>

      {/* Add relation panel */}
      {showAddRelated && (
        <div className="mt-3 p-3 border border-dashed border-blue-300 rounded-lg bg-blue-50 space-y-2">
          <select
            value={relatedType}
            onChange={(e) => setRelatedType(e.target.value as RelationType)}
            className="w-full px-3 py-1.5 text-sm border border-gray-300 rounded bg-white focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            {(Object.keys(RELATION_TYPE_LABELS) as RelationType[]).map((t) => (
              <option key={t} value={t}>
                {RELATION_TYPE_LABELS[t]}
              </option>
            ))}
          </select>

          <input
            type="text"
            value={relatedSearch}
            onChange={(e) => setRelatedSearch(e.target.value)}
            placeholder="Search task by title..."
            className="w-full px-3 py-1.5 text-sm border border-gray-300 rounded bg-white focus:outline-none focus:ring-2 focus:ring-blue-500"
            autoFocus
          />

          {searchResults.length > 0 && (
            <div className="border border-gray-200 rounded bg-white max-h-40 overflow-y-auto">
              {searchResults.map((t: Task) => {
                const tid = normalizeId(t.id || t._id);
                return (
                  <button
                    key={tid}
                    onClick={() => handleAddRelatedTask(tid)}
                    disabled={loading}
                    className="w-full text-left px-3 py-2 text-sm hover:bg-blue-50 border-b border-gray-100 last:border-none disabled:opacity-50"
                  >
                    <span className="font-medium">{t.title}</span>
                    <span className="text-gray-400 text-xs ml-2">
                      {t.status}
                    </span>
                  </button>
                );
              })}
            </div>
          )}

          {relatedSearch.trim().length > 0 && searchResults.length === 0 && (
            <p className="text-xs text-gray-400 px-1">
              No matching tasks found
            </p>
          )}

          {error && <p className="text-xs text-red-600">{error}</p>}

          <div className="flex justify-end">
            <button
              onClick={handleCloseAddPanel}
              className="px-3 py-1 text-sm text-gray-600 border border-gray-300 rounded hover:bg-gray-100"
            >
              Cancel
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
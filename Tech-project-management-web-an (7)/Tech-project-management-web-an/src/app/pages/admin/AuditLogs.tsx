import React, { useMemo, useState } from "react";
import { useData } from "../../contexts/DataContext";
import { FileText, Search, Filter } from "lucide-react";
import { API_BASE_URL } from "../../config/baseApi";
export default function AuditLogs() {
  const { auditLogs, getAllUsers, addAuditLog } = useData();
  const [searchQuery, setSearchQuery] = useState("");
  const [filterAction, setFilterAction] = useState("all");

  const users = getAllUsers();

  const normalizedLogs = useMemo(
    () =>
      auditLogs.map((log) => ({
        ...log,
        userObject: typeof log.userId === "object" ? log.userId : null,
        userIdValue:
          typeof log.userId === "string"
            ? log.userId
            : log.userId?._id || log.userId?.id || "",
        logTime: log.createdAt || log.timestamp || log.updatedAt,
      })),
    [auditLogs],
  );

  const filteredLogs = normalizedLogs
    .filter((log) => {
      const matchesSearch =
        log.details.toLowerCase().includes(searchQuery.toLowerCase()) ||
        log.action.toLowerCase().includes(searchQuery.toLowerCase());

      const matchesFilter =
        filterAction === "all" || log.action === filterAction;

      return matchesSearch && matchesFilter;
    })
    .sort(
      (a, b) =>
        new Date(b.logTime || "").getTime() -
        new Date(a.logTime || "").getTime(),
    );

  const actions = ["all", ...new Set(normalizedLogs.map((log) => log.action))];

  const handleExportCsv = async () => {
    const headers = [
      "Timestamp",
      "User",
      "Email",
      "Action",
      "Entity",
      "Details",
    ];
    const rows = filteredLogs.map((log) => {
      const matchedUser = users.find(
        (u) => (u.id || u._id) === log.userIdValue,
      );
      const userName =
        log.userObject?.fullName || matchedUser?.fullName || "Unknown";
      const email = log.userObject?.email || matchedUser?.email || "";
      return [
        log.logTime ? new Date(log.logTime).toLocaleString() : "",
        userName,
        email,
        log.action,
        log.entity,
        (log.details || "").replace(/,/g, " "),
      ];
    });

    const csv = [headers, ...rows]
      .map((row) =>
        row
          .map((cell) => `"${String(cell ?? "").replace(/"/g, '""')}"`)
          .join(","),
      )
      .join("\n");
    const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = `audit-logs-${new Date().toISOString().slice(0, 10)}.csv`;
    link.click();
    URL.revokeObjectURL(url);
    await addAuditLog(
      "export",
      "report",
      "audit-logs",
      `Exported ${filteredLogs.length} audit logs to CSV`,
    );
  };

  return (
    <div className="p-6 max-w-7xl mx-auto">
      <div className="mb-8 flex items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold text-gray-900 mb-2">Audit Logs</h1>
          <p className="text-gray-600">
            Track all system activities and changes
          </p>
        </div>
        <button
          onClick={handleExportCsv}
          className="px-4 py-2 rounded-lg bg-purple-600 text-white hover:bg-purple-700"
        >
          Export CSV
        </button>
      </div>

      {/* Filters */}
      <div className="bg-white p-4 rounded-lg border mb-6">
        <div className="grid md:grid-cols-2 gap-4">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search logs..."
              className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500"
            />
          </div>
          <div className="relative">
            <Filter className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
            <select
              value={filterAction}
              onChange={(e) => setFilterAction(e.target.value)}
              className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500 appearance-none"
            >
              {actions.map((action) => (
                <option key={action} value={action} className="capitalize">
                  {action === "all" ? "All Actions" : action}
                </option>
              ))}
            </select>
          </div>
        </div>
      </div>

      {/* Stats */}
      <div className="grid md:grid-cols-4 gap-6 mb-6">
        <div className="bg-white p-6 rounded-lg border">
          <p className="text-gray-600 mb-2">Total Logs</p>
          <p className="text-3xl font-bold text-gray-900">
            {normalizedLogs.length}
          </p>
        </div>
        <div className="bg-white p-6 rounded-lg border">
          <p className="text-gray-600 mb-2">Creates</p>
          <p className="text-3xl font-bold text-green-600">
            {normalizedLogs.filter((l) => l.action === "create").length}
          </p>
        </div>
        <div className="bg-white p-6 rounded-lg border">
          <p className="text-gray-600 mb-2">Updates</p>
          <p className="text-3xl font-bold text-blue-600">
            {normalizedLogs.filter((l) => l.action === "update").length}
          </p>
        </div>
        <div className="bg-white p-6 rounded-lg border">
          <p className="text-gray-600 mb-2">Deletes</p>
          <p className="text-3xl font-bold text-red-600">
            {normalizedLogs.filter((l) => l.action === "delete").length}
          </p>
        </div>
      </div>

      {/* Logs Table */}
      <div className="bg-white rounded-lg border">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                  Timestamp
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                  User
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                  Action
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                  Entity
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                  Details
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200">
              {filteredLogs.map((log) => {
                const user =
                  log.userObject ||
                  users.find((u) => (u.id || u._id) === log.userIdValue);
                return (
                  <tr key={log.id} className="hover:bg-gray-50">
                    <td className="px-6 py-4 text-sm text-gray-600">
                      {log.logTime
                        ? new Date(log.logTime).toLocaleString()
                        : "-"}
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-2">
                        <div className="w-8 h-8 bg-purple-100 rounded-full flex items-center justify-center">
                          <span className="text-xs text-purple-600 font-medium">
                            {user?.fullName?.charAt(0)?.toUpperCase() || "?"}
                          </span>
                        </div>
                        <div>
                          <p className="text-sm font-medium text-gray-900">
                            {user?.fullName}
                          </p>
                          <p className="text-xs text-gray-600">{user?.email}</p>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <span
                        className={`inline-block px-3 py-1 text-xs font-medium rounded-full capitalize ${
                          log.action === "create"
                            ? "bg-green-100 text-green-600"
                            : log.action === "update"
                              ? "bg-blue-100 text-blue-600"
                              : log.action === "delete"
                                ? "bg-red-100 text-red-600"
                                : "bg-gray-100 text-gray-600"
                        }`}
                      >
                        {log.action}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-sm text-gray-900 capitalize">
                      {log.entity}
                    </td>
                    <td className="px-6 py-4 text-sm text-gray-700">
                      {log.details}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>

        {filteredLogs.length === 0 && (
          <div className="p-12 text-center">
            <FileText className="w-12 h-12 text-gray-400 mx-auto mb-4" />
            <p className="text-gray-600">No audit logs found</p>
          </div>
        )}
      </div>
    </div>
  );
}

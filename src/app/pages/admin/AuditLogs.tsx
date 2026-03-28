import React, { useEffect, useMemo, useState } from "react";
import { useData } from "../../contexts/DataContext";
import { FileText, Search, Filter } from "lucide-react";

export default function AuditLogs() {
  const {
    auditLogs,
    getAllUsers,
    addAuditLog,
    deleteAuditLog,
    deleteAuditLogsByDate,
  } = useData();

  const [searchQuery, setSearchQuery] = useState("");
  const [filterAction, setFilterAction] = useState("all");
  const [filterDate, setFilterDate] = useState("");
  const [currentPage, setCurrentPage] = useState(1);

  const users = getAllUsers();
  const itemsPerPage = 10;

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

  const filteredLogs = useMemo(() => {
    return normalizedLogs
      .filter((log) => {
        const details = (log.details || "").toLowerCase();
        const action = (log.action || "").toLowerCase();
        const entity = (log.entity || "").toLowerCase();
        const query = searchQuery.toLowerCase();

        const matchesSearch =
          details.includes(query) ||
          action.includes(query) ||
          entity.includes(query);

        const matchesAction =
          filterAction === "all" || log.action === filterAction;

        const matchesDate = (() => {
          if (!filterDate) return true;
          if (!log.logTime) return false;

          const logDate = new Date(log.logTime);
          if (Number.isNaN(logDate.getTime())) return false;

          const year = logDate.getFullYear();
          const month = String(logDate.getMonth() + 1).padStart(2, "0");
          const day = String(logDate.getDate()).padStart(2, "0");
          const localDate = `${year}-${month}-${day}`;

          return localDate === filterDate;
        })();

        return matchesSearch && matchesAction && matchesDate;
      })
      .sort((a, b) => {
        const timeA = a.logTime ? new Date(a.logTime).getTime() : 0;
        const timeB = b.logTime ? new Date(b.logTime).getTime() : 0;
        return timeB - timeA;
      });
  }, [normalizedLogs, searchQuery, filterAction, filterDate]);

  const actions = ["all", ...new Set(normalizedLogs.map((log) => log.action))];

  const totalPages = Math.max(1, Math.ceil(filteredLogs.length / itemsPerPage));

  const getVisiblePages = () => {
    const pages: (number | string)[] = [];

    if (totalPages <= 7) {
      for (let i = 1; i <= totalPages; i++) {
        pages.push(i);
      }
      return pages;
    }

    pages.push(1);

    if (currentPage > 3) {
      pages.push("...");
    }

    const startPage = Math.max(2, currentPage - 1);
    const endPage = Math.min(totalPages - 1, currentPage + 1);

    for (let i = startPage; i <= endPage; i++) {
      pages.push(i);
    }

    if (currentPage < totalPages - 2) {
      pages.push("...");
    }

    pages.push(totalPages);

    return pages;
  };

  const paginatedLogs = useMemo(() => {
    const startIndex = (currentPage - 1) * itemsPerPage;
    return filteredLogs.slice(startIndex, startIndex + itemsPerPage);
  }, [filteredLogs, currentPage]);

  useEffect(() => {
    setCurrentPage(1);
  }, [searchQuery, filterAction, filterDate]);

  useEffect(() => {
    if (currentPage > totalPages) {
      setCurrentPage(totalPages);
    }
  }, [currentPage, totalPages]);

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

  const handleDeleteFilteredLogs = async () => {
    if (!filterDate) {
      alert("Please select a date to filter first");
      return;
    }

    if (filteredLogs.length === 0) {
      alert("No audit logs found for the selected date");
      return;
    }

    const confirmed = window.confirm(
      `Delete all audit logs currently filtered on ${filterDate}?`,
    );
    if (!confirmed) return;

    try {
      await deleteAuditLogsByDate(filterDate);

      await addAuditLog(
        "delete",
        "auditlog",
        filterDate,
        `Deleted filtered audit logs on ${filterDate}`,
      );

      setCurrentPage(1);
    } catch (error) {
      alert("Failed to delete filtered audit logs");
    }
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

        {/* <button
          onClick={handleExportCsv}
          className="px-4 py-2 rounded-lg bg-purple-600 text-white hover:bg-purple-700"
        >
          Export CSV
        </button> */}
      </div>

      <div className="bg-white p-4 rounded-lg border mb-6">
        <div className="grid md:grid-cols-3 gap-4">
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

          <div>
            <input
              type="date"
              value={filterDate}
              onChange={(e) => setFilterDate(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500"
            />
          </div>
        </div>
      </div>

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

      <div className="bg-white rounded-lg border">
        <div className="overflow-x-auto">
          <div className="bg-white p-4 rounded-lg border mb-6">
            <div className="flex flex-col md:flex-row md:items-end md:justify-between gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Filter audit logs by date
                </label>
                <div className="text-sm text-gray-500">
                  {filterDate
                    ? `Showing ${filteredLogs.length} log(s) on ${filterDate}`
                    : `Showing ${filteredLogs.length} filtered log(s)`}
                </div>
              </div>

              <div className="flex items-center gap-2">
                {filterDate && (
                  <button
                    onClick={() => setFilterDate("")}
                    className="px-3 py-1.5 text-sm rounded-md border border-gray-300 text-gray-600 hover:bg-gray-50 transition"
                  >
                    Clear date
                  </button>
                )}

                <button
                  onClick={handleDeleteFilteredLogs}
                  className="px-3 py-1.5 text-sm rounded-md bg-gray-100 text-red-600 hover:bg-red-100 hover:text-red-600 transition"
                >
                  Delete filtered logs
                </button>
              </div>
            </div>
          </div>

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
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                  Actions
                </th>
              </tr>
            </thead>

            <tbody className="divide-y divide-gray-200">
              {paginatedLogs.map((log) => {
                const user =
                  log.userObject ||
                  users.find((u) => (u.id || u._id) === log.userIdValue);

                return (
                  <tr key={log.id || log._id} className="hover:bg-gray-50">
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
                            {user?.fullName || "Unknown"}
                          </p>
                          <p className="text-xs text-gray-600">
                            {user?.email || ""}
                          </p>
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

                    <td className="px-6 py-4 text-sm">
                      <button
                        onClick={async () => {
                          const logId = log.id || log._id;
                          if (!logId) return;

                          const confirmed = window.confirm(
                            "Delete this audit log?",
                          );
                          if (!confirmed) return;

                          try {
                            await deleteAuditLog(logId);
                          } catch (error) {
                            alert("Failed to delete audit log");
                          }
                        }}
                        className="px-2 py-0.5 text-xs rounded-md bg-gray-100 text-red-600 hover:bg-red-100 hover:text-red-600 transition"
                      >
                        Delete
                      </button>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>

        {filteredLogs.length === 0 ? (
          <div className="p-12 text-center">
            <FileText className="w-12 h-12 text-gray-400 mx-auto mb-4" />
            <p className="text-gray-600">No audit logs found</p>
          </div>
        ) : (
          <div className="flex items-center justify-between px-6 py-4 border-t">
            <p className="text-sm text-gray-600">
              Showing {(currentPage - 1) * itemsPerPage + 1} to{" "}
              {Math.min(currentPage * itemsPerPage, filteredLogs.length)} of{" "}
              {filteredLogs.length} logs
            </p>

            <div className="flex items-center gap-2">
              <button
                onClick={() => setCurrentPage((prev) => Math.max(prev - 1, 1))}
                disabled={currentPage === 1}
                className="px-3 py-1.5 rounded-lg border text-sm disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-50"
              >
                Prev
              </button>

              {getVisiblePages().map((page, index) =>
                page === "..." ? (
                  <span
                    key={`ellipsis-${index}`}
                    className="px-2 py-1.5 text-sm text-gray-500"
                  >
                    ...
                  </span>
                ) : (
                  <button
                    key={page}
                    onClick={() => setCurrentPage(Number(page))}
                    className={`px-3 py-1.5 rounded-lg text-sm ${
                      currentPage === page
                        ? "bg-purple-600 text-white"
                        : "border hover:bg-gray-50"
                    }`}
                  >
                    {page}
                  </button>
                ),
              )}

              <button
                onClick={() =>
                  setCurrentPage((prev) => Math.min(prev + 1, totalPages))
                }
                disabled={currentPage === totalPages}
                className="px-3 py-1.5 rounded-lg border text-sm disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-50"
              >
                Next
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

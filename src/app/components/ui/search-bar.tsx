import React, { useState, useRef, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router';
import { Search, FolderKanban, ListTodo, X } from 'lucide-react';
import { useAuth } from '../../contexts/AuthContext';
import { useData } from '../../contexts/DataContext';

export default function SearchBar() {
  const { user } = useAuth();
  const { getUserProjects, getTasksByProject } = useData();
  const navigate = useNavigate();
  const location = useLocation();

  const [query, setQuery] = useState('');
  const [isOpen, setIsOpen] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  // Detect current projectId from URL: /app/projects/:projectId/...
  const projectIdFromUrl = location.pathname.match(/\/app\/projects\/([^/]+)/)?.[1];

  const userId = user?.id || user?._id || '';
  const userProjects = getUserProjects(userId);
  const currentProjectTasks = projectIdFromUrl ? getTasksByProject(projectIdFromUrl) : [];

  const trimmed = query.trim().toLowerCase();

  const filteredProjects = trimmed
    ? userProjects.filter((p) => p.name?.toLowerCase().includes(trimmed))
    : [];

  const filteredTasks = trimmed
    ? currentProjectTasks.filter(
        (t) =>
          t.title?.toLowerCase().includes(trimmed) ||
          t.description?.toLowerCase().includes(trimmed),
      )
    : [];

  const hasResults = filteredProjects.length > 0 || filteredTasks.length > 0;

  // Close dropdown when clicking outside
  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setIsOpen(false);
      }
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, []);

  const handleSelect = (path: string) => {
    setQuery('');
    setIsOpen(false);
    navigate(path);
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setQuery(e.target.value);
    setIsOpen(true);
  };

  const handleClear = () => {
    setQuery('');
    setIsOpen(false);
    inputRef.current?.focus();
  };

  const statusColors: Record<string, string> = {
    todo: 'bg-gray-100 text-gray-600',
    'in-progress': 'bg-blue-100 text-blue-600',
    inprogress: 'bg-blue-100 text-blue-600',
    done: 'bg-green-100 text-green-600',
    review: 'bg-yellow-100 text-yellow-700',
  };

  return (
    <div ref={containerRef} className="relative flex-1 max-w-md ml-4 hidden md:block">
      {/* Input */}
      <div className="relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400 pointer-events-none" />
        <input
          ref={inputRef}
          type="text"
          value={query}
          onChange={handleChange}
          onFocus={() => trimmed && setIsOpen(true)}
          placeholder={
            projectIdFromUrl
              ? 'Search projects & tasks in this project...'
              : 'Search projects...'
          }
          className="w-full pl-10 pr-8 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm"
        />
        {query && (
          <button
            onClick={handleClear}
            className="absolute right-2 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
          >
            <X className="w-4 h-4" />
          </button>
        )}
      </div>

      {/* Dropdown */}
      {isOpen && trimmed && (
        <div className="absolute top-full mt-1 left-0 right-0 bg-white rounded-lg shadow-lg border border-gray-200 z-50 max-h-80 overflow-y-auto">
          {!hasResults ? (
            <div className="px-4 py-6 text-center text-sm text-gray-400">
              No results found for "{query}"
            </div>
          ) : (
            <>
              {/* Projects section */}
              {filteredProjects.length > 0 && (
                <div>
                  <div className="px-3 pt-3 pb-1">
                    <span className="text-xs font-semibold text-gray-400 uppercase tracking-wide">
                      Projects
                    </span>
                  </div>
                  {filteredProjects.map((project) => {
                    const id = project.id || project._id;
                    return (
                      <button
                        key={id}
                        onMouseDown={() => handleSelect(`/app/projects/${id}`)}
                        className="w-full flex items-center gap-3 px-3 py-2 hover:bg-gray-50 text-left transition-colors"
                      >
                        <div className="w-7 h-7 rounded-md bg-blue-100 flex items-center justify-center flex-shrink-0">
                          <FolderKanban className="w-4 h-4 text-blue-600" />
                        </div>
                        <div className="min-w-0">
                          <p className="text-sm font-medium text-gray-800 truncate">
                            {project.name}
                          </p>
                          {project.methodology && (
                            <p className="text-xs text-gray-400 capitalize">
                              {project.methodology}
                            </p>
                          )}
                        </div>
                      </button>
                    );
                  })}
                </div>
              )}

              {/* Divider */}
              {filteredProjects.length > 0 && filteredTasks.length > 0 && (
                <div className="border-t border-gray-100 mx-3" />
              )}

              {/* Tasks section */}
              {filteredTasks.length > 0 && (
                <div>
                  <div className="px-3 pt-3 pb-1">
                    <span className="text-xs font-semibold text-gray-400 uppercase tracking-wide">
                      Tasks in current project
                    </span>
                  </div>
                  {filteredTasks.map((task) => {
                    const id = task.id || task._id;
                    const statusKey = (task.status || '').toLowerCase().replace(/\s/g, '');
                    return (
                      <button
                        key={id}
                        onMouseDown={() =>
                          handleSelect(`/app/projects/${projectIdFromUrl}/tasks/${id}`)
                        }
                        className="w-full flex items-center gap-3 px-3 py-2 hover:bg-gray-50 text-left transition-colors"
                      >
                        <div className="w-7 h-7 rounded-md bg-purple-100 flex items-center justify-center flex-shrink-0">
                          <ListTodo className="w-4 h-4 text-purple-600" />
                        </div>
                        <div className="min-w-0 flex-1">
                          <p className="text-sm font-medium text-gray-800 truncate">
                            {task.title}
                          </p>
                          {task.status && (
                            <span
                              className={`inline-block text-xs px-1.5 py-0.5 rounded font-medium mt-0.5 ${
                                statusColors[statusKey] || 'bg-gray-100 text-gray-600'
                              }`}
                            >
                              {task.status}
                            </span>
                          )}
                        </div>
                      </button>
                    );
                  })}
                </div>
              )}

              <div className="h-2" />
            </>
          )}
        </div>
      )}
    </div>
  );
}
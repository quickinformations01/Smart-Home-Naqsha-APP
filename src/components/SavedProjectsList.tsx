import React from 'react';
import { FileText, Trash2, FolderOpen, Calendar, HelpCircle } from 'lucide-react';
import { SavedProject } from '../types';

interface SavedProjectsListProps {
  projects: SavedProject[];
  onLoad: (project: SavedProject) => void;
  onDelete: (id: string) => void;
}

export default function SavedProjectsList({ projects, onLoad, onDelete }: SavedProjectsListProps) {
  if (projects.length === 0) {
    return (
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl p-6 text-center space-y-4">
        <div className="flex justify-center">
          <div className="p-3 bg-slate-50 dark:bg-slate-800 text-slate-400 dark:text-slate-500 rounded-full">
            <FolderOpen className="w-6 h-6" />
          </div>
        </div>
        <div>
          <h3 className="text-sm font-bold text-slate-800 dark:text-slate-200">
            No saved plans yet
          </h3>
          <p className="text-xs text-slate-500 dark:text-slate-400 max-w-xs mx-auto mt-1 leading-relaxed">
            Generate and edit a layout, then click &quot;Save Project&quot; to keep multiple variations of your blueprints offline.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl p-6 shadow-md">
      <div className="flex items-center space-x-2.5 mb-4 pb-2 border-b border-slate-100 dark:border-slate-800">
        <FolderOpen className="w-5 h-5 text-blue-600" />
        <h3 className="text-sm font-bold text-slate-900 dark:text-white">
          Offline Local Vault ({projects.length})
        </h3>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {projects.map((project) => (
          <div
            key={project.id}
            className="flex flex-col justify-between p-4 border border-slate-200 dark:border-slate-800 hover:border-blue-400 dark:hover:border-blue-800 rounded-2xl bg-slate-50/20 dark:bg-slate-800/10 hover:bg-slate-50 dark:hover:bg-slate-800/20 transition-all cursor-pointer group"
            onClick={() => onLoad(project)}
          >
            <div>
              <div className="flex items-start justify-between gap-3">
                <div className="space-y-1">
                  <h4 className="text-sm font-bold text-slate-800 dark:text-slate-100 group-hover:text-blue-600 transition truncate max-w-[150px]">
                    {project.name}
                  </h4>
                  <div className="flex items-center text-[10px] text-slate-400 dark:text-slate-500 space-x-1">
                    <Calendar className="w-3 h-3" />
                    <span>{new Date(project.createdAt).toLocaleDateString()}</span>
                  </div>
                </div>

                <button
                  type="button"
                  onClick={(e) => {
                    e.stopPropagation();
                    onDelete(project.id);
                  }}
                  className="p-1.5 text-slate-400 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-950/20 rounded-lg transition"
                  title="Delete project"
                  id={`delete-saved-${project.id}`}
                >
                  <Trash2 className="w-3.5 h-3.5" />
                </button>
              </div>

              {/* Dimensions badge */}
              <div className="mt-4 flex items-center space-x-2">
                <span className="text-[10px] font-bold text-slate-500 dark:text-slate-400 bg-slate-100 dark:bg-slate-800 py-1 px-2.5 rounded-full font-mono">
                  {project.layout.width} x {project.layout.length} {project.layout.unit}
                </span>
                <span className="text-[10px] text-slate-400 dark:text-slate-500 font-medium">
                  {project.layout.rooms.length} rooms
                </span>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

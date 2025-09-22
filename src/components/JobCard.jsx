import React from 'react';

export default function JobCard({
  job,
  isSelected,
  onSelect,
  onEdit,
  onDelete,
  onArchiveToggle,
  onDragStart,
  onDragOver,
  onDrop,
  isDragging
}) {
  return (
    <div
      draggable
      onDragStart={onDragStart}
      onDragOver={onDragOver}
      onDrop={onDrop}
      className={`bg-gray-800 rounded-xl shadow-sm border p-6 cursor-pointer transition-all ${
        isSelected ? 'border-blue-500 ring-2 ring-blue-900/40' : 'border-gray-700 hover:border-gray-600'
      } ${isDragging ? 'opacity-50' : ''}`}
      onClick={onSelect}
    >
      {/* Header */}
      <div className="flex justify-between items-start mb-4">
        <div className="flex-1">
          <h3 className="text-lg font-semibold text-gray-100 mb-1">
            {job.title}
          </h3>
          <p className="text-sm text-gray-400 font-mono">/{job.slug}</p>
        </div>
        
        <div className="flex items-center space-x-2">
          <span
            className={`px-2 py-1 text-xs font-medium rounded-full ${
              job.status === 'active'
                ? 'bg-green-900/40 text-green-300'
                : 'bg-gray-700 text-gray-300'
            }`}
          >
            {job.status}
          </span>
          
          <div className="flex space-x-1">
            <button
              onClick={(e) => {
                e.stopPropagation();
                onEdit();
              }}
              className="text-gray-400 hover:text-blue-400 p-1"
              title="Edit job"
            >
              ✏️
            </button>
            
            <button
              onClick={(e) => {
                e.stopPropagation();
                onArchiveToggle();
              }}
              className="text-gray-400 hover:text-yellow-400 p-1"
              title={job.status === 'active' ? 'Archive job' : 'Unarchive job'}
            >
              {job.status === 'active' ? '📦' : '📤'}
            </button>
            
            <button
              onClick={(e) => {
                e.stopPropagation();
                onDelete();
              }}
              className="text-gray-400 hover:text-red-400 p-1"
              title="Delete job"
            >
              🗑️
            </button>
          </div>
        </div>
      </div>

      {/* Description */}
      {job.description && (
        <p className="text-gray-300 text-sm mb-4 line-clamp-2">
          {job.description}
        </p>
      )}

      {/* Tags */}
      {job.tags && job.tags.length > 0 && (
        <div className="flex flex-wrap gap-1 mb-4">
          {job.tags.map((tag, index) => (
            <span
              key={index}
              className="px-2 py-1 bg-blue-900/30 text-blue-200 text-xs rounded-md"
            >
              {tag}
            </span>
          ))}
        </div>
      )}

      {/* Quick Actions */}
      <div className="mt-2 flex flex-wrap gap-2">
        <button
          onClick={(e) => {
            e.stopPropagation();
            window.location.href = `/assessments/${job.id}`;
          }}
          className="px-3 py-1.5 text-sm border border-gray-700 rounded-lg hover:bg-gray-700/60"
        >
          📝 Manage Assessment
        </button>
        <button
          onClick={(e) => {
            e.stopPropagation();
            window.location.href = `/assessments/${job.id}/submissions`;
          }}
          className="px-3 py-1.5 text-sm border border-gray-700 rounded-lg hover:bg-gray-700/60"
        >
          📥 View Submissions
        </button>
        <button
          onClick={(e) => {
            e.stopPropagation();
            onSelect();
          }}
          className="px-3 py-1.5 text-sm border border-gray-700 rounded-lg hover:bg-gray-700/60"
        >
          🔎 View Details
        </button>
        <div className="ml-auto flex items-center gap-2 self-center">
          <span className="text-xs text-gray-400">🔄 Drag to reorder</span>
          <span className="text-[11px] px-2 py-0.5 rounded bg-gray-700/60 text-gray-100 border border-gray-600">
            Order: <span className="font-semibold">{job.order}</span>
          </span>
        </div>
      </div>
    </div>
  );
}
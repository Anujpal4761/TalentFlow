import React from 'react';
import { useNavigate, useLocation } from 'react-router-dom';

export default function Navigation({ currentView, onViewChange }) {
  const navigate = useNavigate();
  const location = useLocation();

  const navItems = [
    { id: 'jobs', label: 'Jobs', icon: '💼', path: '/jobs' },
    { id: 'candidates', label: 'Candidates', icon: '👥', path: '/candidates' },
    { id: 'kanban', label: 'Pipeline', icon: '📋', path: '/kanban' },
    { id: 'assessments', label: 'Assessments', icon: '📝', path: '/assessments' }
  ];

  const handleNavClick = (item) => {
    navigate(item.path);
    if (onViewChange) {
      onViewChange(item.id);
    }
  };

  const isActive = (item) => {
    return location.pathname === item.path || 
           (item.id === 'jobs' && location.pathname === '/') ||
           location.pathname.startsWith(item.path + '/');
  };

  return (
    <nav className="flex space-x-1">
      {navItems.map((item) => (
        <button
          key={item.id}
          onClick={() => handleNavClick(item)}
          className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors border ${
            isActive(item)
              ? 'bg-blue-900/40 text-blue-200 border-blue-800'
              : 'text-gray-300 border-gray-700 hover:bg-gray-700/60 hover:text-white'
          }`}
        >
          <span className="mr-2">{item.icon}</span>
          {item.label}
        </button>
      ))}
    </nav>
  );
}
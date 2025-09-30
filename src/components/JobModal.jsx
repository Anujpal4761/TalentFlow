import React, { useState, useEffect } from 'react';
import { jobsAPI } from '../utils/api';

export default function JobModal({ job, onSave, onClose, isLoading }) {
  const [formData, setFormData] = useState({
    title: '',
    slug: '',
    status: 'active',
    tags: '',
    description: ''
  });
  const [errors, setErrors] = useState({});

  useEffect(() => {
    if (job) {
      setFormData({
        title: job.title || '',
        slug: job.slug || '',
        status: job.status || 'active',
        tags: job.tags ? job.tags.join(', ') : '',
        description: job.description || ''
      });
    } else {
      setFormData({
        title: '',
        slug: '',
        status: 'active',
        tags: '',
        description: ''
      });
    }
    setErrors({});
  }, [job]);

  const generateSlug = (title) => {
    return title
      .toLowerCase()
      .replace(/[^a-z0-9\s-]/g, '')
      .replace(/\s+/g, '-')
      .replace(/-+/g, '-')
      .trim();
  };

  const handleTitleChange = (e) => {
    const title = e.target.value;
    setFormData(prev => ({
      ...prev,
      title,
      slug: prev.slug || generateSlug(title)
    }));
  };

  const validateForm = () => {
    const newErrors = {};

    if (!formData.title.trim()) {
      newErrors.title = 'Title is required';
    }

    if (!formData.slug.trim()) {
      newErrors.slug = 'Slug is required';
    } else if (!/^[a-z0-9-]+$/.test(formData.slug)) {
      newErrors.slug = 'Slug can only contain lowercase letters, numbers, and hyphens';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!validateForm()) {
      return;
    }

    // Async slug uniqueness check against existing jobs in IndexedDB via API
    try {
      const existing = await jobsAPI.getJobs({ status: 'all', page: 1, pageSize: 1000, search: '' });
      const normalizedSlug = formData.slug.trim();
      const conflict = (existing?.data || []).find(j => j.slug === normalizedSlug && j.id !== job?.id);
      if (conflict) {
        setErrors(prev => ({ ...prev, slug: 'Slug must be unique. This slug is already in use.' }));
        return;
      }
    } catch (err) {
      // If API check fails, surface a generic message but allow save to proceed
      console.warn('Failed to validate slug uniqueness:', err);
    }

    const jobData = {
      ...(job && { id: job.id }),
      title: formData.title.trim(),
      slug: formData.slug.trim(),
      status: formData.status,
      tags: formData.tags
        .split(',')
        .map(tag => tag.trim())
        .filter(tag => tag.length > 0),
      description: formData.description.trim(),
      order: job?.order || Date.now()
    };

    onSave(jobData);
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
      <div className="bg-gray-800 rounded-lg shadow-xl max-w-md w-full max-h-[90vh] overflow-y-auto">
        <div className="p-6">
          <div className="flex justify-between items-center mb-4">
            <h2 className="text-xl font-semibold text-gray-100">
              {job ? 'Edit Job' : 'Create New Job'}
            </h2>
            <button
              onClick={onClose}
              className="text-gray-300 hover:text-gray-300 text-xl"
            >
              ×
            </button>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            {/* Title */}
            <div>
              <label className="block text-sm font-medium text-gray-200 mb-1">
                Title *
              </label>
              <input
                type="text"
                value={formData.title}
                onChange={handleTitleChange}
                className={`bg-gray-700 text-gray-100 placeholder-gray-400 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                  errors.title ? 'border-red-500' : 'border-gray-600'
                }`}
                placeholder="e.g., Senior Frontend Developer"
              />
              {errors.title && (
                <p className="text-red-500 text-xs mt-1">{errors.title}</p>
              )}
            </div>

            {/* Slug */}
            <div>
              <label className="block text-sm font-medium text-gray-200 mb-1">
                Slug *
              </label>
              <input
                type="text"
                value={formData.slug}
                onChange={(e) => setFormData(prev => ({ ...prev, slug: e.target.value }))}
                className={`bg-gray-700 text-gray-100 placeholder-gray-400 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                  errors.slug ? 'border-red-500' : 'border-gray-600'
                }`}
                placeholder="e.g., senior-frontend-developer"
              />
              {errors.slug && (
                <p className="text-red-500 text-xs mt-1">{errors.slug}</p>
              )}
              <p className="text-gray-400 text-xs mt-1">
                URL-friendly version of the title
              </p>
            </div>

            {/* Status */}
            <div>
              <label className="block text-sm font-medium text-gray-200 mb-1">
                Status
              </label>
              <select
                value={formData.status}
                onChange={(e) => setFormData(prev => ({ ...prev, status: e.target.value }))}
                className="bg-gray-700 text-gray-100 border border-gray-600 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="active">Active</option>
                <option value="archived">Archived</option>
              </select>
            </div>

            {/* Tags */}
            <div>
              <label className="block text-sm font-medium text-gray-200 mb-1">
                Tags
              </label>
              <input
                type="text"
                value={formData.tags}
                onChange={(e) => setFormData(prev => ({ ...prev, tags: e.target.value }))}
                className="bg-gray-700 text-gray-100 border border-gray-600 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="e.g., React, TypeScript, CSS"
              />
              <p className="text-gray-400 text-xs mt-1">
                Separate tags with commas
              </p>
            </div>

            {/* Description */}
            <div>
              <label className="block text-sm font-medium text-gray-200 mb-1">
                Description
              </label>
              <textarea
                value={formData.description}
                onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
                rows={4}
                className="bg-gray-700 text-gray-100 border border-gray-600 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="Job description..."
              />
            </div>

            {/* Actions */}
            <div className="flex justify-end space-x-3 pt-4">
              <button
                type="button"
                onClick={onClose}
                className="px-4 py-2 text-gray-200 border border-gray-600 rounded-md hover:bg-gray-700"
                disabled={isLoading}
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={isLoading}
                className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {isLoading ? 'Saving...' : (job ? 'Update Job' : 'Create Job')}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}
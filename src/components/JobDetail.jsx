import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useNavigate } from 'react-router-dom';
import { getJob, saveJob, deleteJob } from '../utils/indexedDB';
import JobModal from './JobModal';

export default function JobDetail({ jobId, onBack }) {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const navigate = useNavigate();
  const queryClient = useQueryClient();

  // Fetch job details
  const { data: job, isLoading, error } = useQuery({
    queryKey: ['job', jobId],
    queryFn: () => getJob(jobId),
    enabled: !!jobId
  });

  // Update job mutation
  const updateJobMutation = useMutation({
    mutationFn: saveJob,
    onSuccess: () => {
      queryClient.invalidateQueries(['job', jobId]);
      queryClient.invalidateQueries(['jobs']);
      setIsEditing(false);
      setIsModalOpen(false);
    },
    onError: (error) => {
      console.error('Error updating job:', error);
      alert('Failed to update job. Please try again.');
    }
  });

  // Delete job mutation
  const deleteJobMutation = useMutation({
    mutationFn: deleteJob,
    onSuccess: () => {
      queryClient.invalidateQueries(['jobs']);
      navigate('/jobs');
    },
    onError: (error) => {
      console.error('Error deleting job:', error);
      alert('Failed to delete job. Please try again.');
    }
  });

  const handleEdit = () => {
    setIsEditing(true);
    setIsModalOpen(true);
  };

  const handleDelete = () => {
    if (window.confirm('Are you sure you want to delete this job?')) {
      deleteJobMutation.mutate(jobId);
    }
  };

  const handleArchiveToggle = () => {
    if (job) {
      const newStatus = job.status === 'active' ? 'archived' : 'active';
      updateJobMutation.mutate({ ...job, status: newStatus });
    }
  };

  if (isLoading) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="text-lg text-gray-300">Loading job details...</div>
      </div>
    );
  }

  if (error || !job) {
    return (
      <div className="text-center py-12">
        <div className="text-gray-400 text-lg mb-2">Job not found</div>
        <button
          onClick={onBack}
          className="text-blue-600 hover:text-blue-800"
        >
          ← Back to jobs
        </button>
      </div>
    );
  }

  return (
    <div className="bg-gray-800">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-4">
          <button
            onClick={onBack}
            className="text-gray-300 hover:text-gray-100"
          >
            ← Back
          </button>
          <h2 className="text-2xl font-bold text-gray-100">{job.title}</h2>
        </div>
        
        <div className="flex space-x-3">
          <button
            onClick={handleEdit}
            className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700"
          >
            Edit Job
          </button>
          
          <button
            onClick={handleArchiveToggle}
            className={`px-4 py-2 rounded-lg ${
              job.status === 'active'
                ? 'bg-yellow-600 text-white hover:bg-yellow-700'
                : 'bg-green-600 text-white hover:bg-green-700'
            }`}
          >
            {job.status === 'active' ? 'Archive' : 'Unarchive'}
          </button>
          
          <button
            onClick={handleDelete}
            className="bg-red-600 text-white px-4 py-2 rounded-lg hover:bg-red-700"
          >
            Delete
          </button>
        </div>
      </div>

      {/* Job Details */}
      <div className="bg-gray-800 rounded-lg shadow-sm border p-6">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <div>
            <h3 className="text-lg font-semibold text-gray-100 mb-4">Job Information</h3>
            
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-200 mb-1">
                  Title
                </label>
                <p className="text-gray-100">{job.title}</p>
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-200 mb-1">
                  Slug
                </label>
                <p className="text-gray-300 font-mono">/{job.slug}</p>
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-200 mb-1">
                  Status
                </label>
                <span
                  className={`inline-flex px-2 py-1 text-xs font-medium rounded-full ${
                    job.status === 'active'
                      ? 'bg-green-800 text-green-100'
                      : 'bg-gray-600 text-gray-100'
                  }`}
                >
                  {job.status}
                </span>
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-200 mb-1">
                  Order
                </label>
                <p className="text-gray-300">{job.order}</p>
              </div>
            </div>
          </div>
          
          <div>
            <h3 className="text-lg font-semibold text-gray-100 mb-4">Tags</h3>
            {job.tags && job.tags.length > 0 ? (
              <div className="flex flex-wrap gap-2">
                {job.tags.map((tag, index) => (
                  <span
                    key={index}
                    className="px-3 py-1 bg-blue-600 text-white text-sm rounded-full"
                  >
                    {tag}
                  </span>
                ))}
              </div>
            ) : (
              <p className="text-gray-400">No tags assigned</p>
            )}
          </div>
        </div>
        
        {job.description && (
          <div className="mt-6">
            <h3 className="text-lg font-semibold text-gray-100 mb-4">Description</h3>
            <div className="prose max-w-none">
              <p className="text-gray-200 whitespace-pre-wrap">{job.description}</p>
            </div>
          </div>
        )}
      </div>

      {/* Quick Actions */}
      <div className="bg-gray-800 rounded-lg shadow-sm border p-6">
        <h3 className="text-lg font-semibold text-gray-100 mb-4">Quick Actions</h3>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <button
            onClick={() => navigate(`/candidates?jobId=${jobId}`)}
            className="p-4 border border-gray-200 rounded-lg hover:bg-gray-50 text-left"
          >
            <div className="text-blue-600 text-2xl mb-2">👥</div>
            <div className="font-medium text-gray-100">View Candidates</div>
            <div className="text-sm text-gray-400">See all candidates for this job</div>
          </button>
          
          <button
            onClick={() => navigate(`/assessments/${jobId}`)}
            className="p-4 border border-gray-200 rounded-lg hover:bg-gray-50 text-left"
          >
            <div className="text-green-600 text-2xl mb-2">📝</div>
            <div className="font-medium text-gray-100">Manage Assessment</div>
            <div className="text-sm text-gray-400">Create or edit job assessment</div>
          </button>
          
          <button
            onClick={() => navigate('/kanban')}
            className="p-4 border border-gray-200 rounded-lg hover:bg-gray-50 text-left"
          >
            <div className="text-purple-600 text-2xl mb-2">📋</div>
            <div className="font-medium text-gray-100">Pipeline View</div>
            <div className="text-sm text-gray-400">View candidates in pipeline</div>
          </button>
        </div>
      </div>

      {/* Job Modal */}
      {isModalOpen && (
        <JobModal
          job={isEditing ? job : null}
          onSave={(jobData) => updateJobMutation.mutate(jobData)}
          onClose={() => {
            setIsModalOpen(false);
            setIsEditing(false);
          }}
          isLoading={updateJobMutation.isLoading}
        />
      )}
    </div>
  );
}

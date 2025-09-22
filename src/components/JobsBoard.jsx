import React, { useState, useEffect } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useNavigate } from "react-router-dom";
import { jobsAPI } from "../utils/api";
import { seedData } from "../utils/indexedDB";
import JobModal from "./JobModal";
import JobCard from "./JobCard";

export default function JobsBoard({ onJobSelect, selectedJobId }) {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingJob, setEditingJob] = useState(null);
  const [filters, setFilters] = useState({
    search: "",
    status: "all",
    tags: "",
    sort: "order",
  });
  const [currentPage, setCurrentPage] = useState(1);
  const [draggedJob, setDraggedJob] = useState(null);

  const queryClient = useQueryClient();
  const navigate = useNavigate();
  const pageSize = 12;

  // Seed demo data on first load
  useEffect(() => {
    const initData = async () => {
      try {
        await seedData();
        queryClient.invalidateQueries(["jobs"]);
      } catch (error) {
        console.error("Error seeding data:", error);
      }
    };
    initData();
  }, [queryClient]);

  // Fetch jobs
  const { data: jobsResponse, isLoading, error } = useQuery({
    queryKey: ["jobs", filters, currentPage],
    queryFn: () =>
      jobsAPI.getJobs({
        search: filters.search,
        status: filters.status === "all" ? "" : filters.status,
        page: currentPage,
        pageSize,
        sort: filters.sort,
        tags: filters.tags,
      }),
    staleTime: 1000 * 60 * 5,
  });

  const allJobs = jobsResponse?.data || [];
  const pagination = jobsResponse?.pagination || { totalPages: 1 };

  // Mutations
  const saveJobMutation = useMutation({
    mutationFn: async (jobData) =>
      jobData.id ? jobsAPI.updateJob(jobData.id, jobData) : jobsAPI.createJob(jobData),
    onSuccess: () => {
      queryClient.invalidateQueries(["jobs"]);
      setIsModalOpen(false);
      setEditingJob(null);
    },
    onError: () => alert("❌ Failed to save job. Try again."),
  });

  const deleteJobMutation = useMutation({
    mutationFn: (jobId) => jobsAPI.deleteJob(jobId),
    onSuccess: () => queryClient.invalidateQueries(["jobs"]),
    onError: () => alert("❌ Failed to delete job. Try again."),
  });

  const reorderJobsMutation = useMutation({
    mutationFn: async ({ jobId, newOrder }) => {
      const job = allJobs.find((j) => j.id === jobId);
      if (job) return jobsAPI.reorderJob(jobId, job.order, newOrder);
    },
    onMutate: async ({ jobId, newOrder }) => {
      await queryClient.cancelQueries(["jobs"]);
      const previousJobs = queryClient.getQueryData(["jobs", filters, currentPage]);
      queryClient.setQueryData(["jobs", filters, currentPage], (old) => ({
        ...old,
        data: old.data.map((job) =>
          job.id === jobId ? { ...job, order: newOrder } : job
        ),
      }));
      return { previousJobs };
    },
    onError: (_, __, context) =>
      queryClient.setQueryData(["jobs", filters, currentPage], context.previousJobs),
    onSettled: () => queryClient.invalidateQueries(["jobs"]),
  });

  // Handlers
  const handleCreateJob = () => {
    setEditingJob(null);
    setIsModalOpen(true);
  };
  const handleEditJob = (job) => {
    setEditingJob(job);
    setIsModalOpen(true);
  };
  const handleJobClick = (job) => navigate(`/jobs/${job.id}`);
  const handleDeleteJob = (jobId) =>
    window.confirm("Delete this job?") && deleteJobMutation.mutate(jobId);
  const handleArchiveToggle = (job) =>
    saveJobMutation.mutate({ ...job, status: job.status === "active" ? "archived" : "active" });
  const handleDragStart = (e, job) => {
    setDraggedJob(job);
    e.dataTransfer.effectAllowed = "move";
  };
  const handleDragOver = (e) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = "move";
  };
  const handleDrop = (e, targetJob) => {
    e.preventDefault();
    if (draggedJob && draggedJob.id !== targetJob.id) {
      reorderJobsMutation.mutate({ jobId: draggedJob.id, newOrder: targetJob.order });
    }
    setDraggedJob(null);
  };

  if (isLoading) {
    return (
      <div className="flex justify-center items-center h-64">
        <span className="text-lg text-gray-600">⏳ Loading jobs...</span>
      </div>
    );
  }
  if (error) {
    return <div className="text-center text-red-600 p-4">Error: {error.message}</div>;
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
        <div>
          <h2 className="text-2xl font-bold text-white">Jobs Board</h2>
          <p className="text-sm text-gray-500">
            Manage openings, archive, and reorder. Total:{" "}
            {jobsResponse?.pagination?.total ?? 0}
          </p>
        </div>
        <div className="flex items-center gap-3">
          <label className="text-sm text-gray-100">Sort by</label>
          <select
            value={filters.sort}
            onChange={(e) => setFilters({ ...filters, sort: e.target.value })}
            className="px-3 py-2 border border-gray-700 rounded-lg bg-gray-900 text-gray-100 focus:ring-2 focus:ring-blue-500"
          >
            <option value="order">Order</option>
            <option value="title">Title</option>
          </select>
          <button
            onClick={handleCreateJob}
            className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 shadow transition"
          >
            + Create Job
          </button>
        </div>
      </div>

      {/* Filters */}
      <div className="bg-gray-800 p-4 rounded-lg shadow-sm border border-gray-700 space-y-4">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-100 mb-1">
              🔎 Search
            </label>
            <input
              type="text"
              value={filters.search}
              onChange={(e) => setFilters({ ...filters, search: e.target.value })}
              placeholder="Search by title or slug..."
              className="w-full px-3 py-2 border border-gray-700 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 bg-gray-900 text-gray-100 placeholder-gray-500"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-100 mb-1">📂 Status</label>
            <select
              value={filters.status}
              onChange={(e) => setFilters({ ...filters, status: e.target.value })}
              className="w-full px-3 py-2 border border-gray-700 rounded-lg focus:ring-2 focus:ring-blue-500 bg-gray-900 text-gray-100"
            >
              <option value="all">All</option>
              <option value="active">Active</option>
              <option value="archived">Archived</option>
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-100 mb-1">🏷️ Tags</label>
            <input
              type="text"
              value={filters.tags}
              onChange={(e) => setFilters({ ...filters, tags: e.target.value })}
              placeholder="Filter by tags..."
              className="w-full px-3 py-2 border border-gray-700 rounded-lg focus:ring-2 focus:ring-blue-500 bg-gray-900 text-gray-100 placeholder-gray-500"
            />
          </div>
        </div>
      </div>

      {/* Jobs Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {allJobs.map((job) => (
          <JobCard
            key={job.id}
            job={job}
            isSelected={selectedJobId === job.id}
            onSelect={() => handleJobClick(job)}
            onEdit={() => handleEditJob(job)}
            onDelete={() => handleDeleteJob(job.id)}
            onArchiveToggle={() => handleArchiveToggle(job)}
            onDragStart={(e) => handleDragStart(e, job)}
            onDragOver={handleDragOver}
            onDrop={(e) => handleDrop(e, job)}
            isDragging={draggedJob?.id === job.id}
          />
        ))}
      </div>

      {/* Empty State */}
      {allJobs.length === 0 && (
        <div className="text-center py-16 border rounded-lg bg-gray-50 shadow-sm">
          <div className="text-gray-500 text-lg mb-2">No jobs found 🚫</div>
          <p className="text-gray-400 text-sm mb-4">
            Try adjusting filters or create a new job
          </p>
          <button
            onClick={handleCreateJob}
            className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 shadow"
          >
            + Create Job
          </button>
        </div>
      )}

      {/* Pagination */}
      {pagination.total > 12 && (
        <div className="flex justify-center space-x-2">
          <button
            onClick={() => setCurrentPage(Math.max(1, currentPage - 1))}
            disabled={currentPage === 1}
            className="px-3 py-2 border rounded-lg disabled:opacity-50 hover:bg-gray-50"
          >
            ⬅ Previous
          </button>
          <span className="px-3 py-2 text-gray-700">
            Page {currentPage} of {pagination.totalPages}
          </span>
          <button
            onClick={() => setCurrentPage(Math.min(pagination.totalPages, currentPage + 1))}
            disabled={currentPage === pagination.totalPages}
            className="px-3 py-2 border rounded-lg disabled:opacity-50 hover:bg-gray-50"
          >
            Next ➡
          </button>
        </div>
      )}

      {/* Job Modal */}
      {isModalOpen && (
        <JobModal
          job={editingJob}
          onSave={(jobData) => saveJobMutation.mutate(jobData)}
          onClose={() => {
            setIsModalOpen(false);
            setEditingJob(null);
          }}
          isLoading={saveJobMutation.isLoading}
        />
      )}
    </div>
  );
}

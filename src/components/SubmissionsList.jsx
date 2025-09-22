import React from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { assessmentsAPI, jobsAPI } from '../utils/api';

export default function SubmissionsList() {
  const { jobId } = useParams();
  const navigate = useNavigate();

  const { data: job } = useQuery({
    queryKey: ['job', jobId],
    queryFn: () => jobsAPI.getJob(jobId),
    enabled: !!jobId,
  });

  const { data: response, isLoading, error } = useQuery({
    queryKey: ['submissions', jobId],
    queryFn: () => assessmentsAPI.getSubmissions(jobId),
    enabled: !!jobId,
    staleTime: 1000 * 60 * 5,
  });

  const submissions = response?.data || [];

  if (!jobId) {
    return (
      <div className="text-center py-12">
        <div className="text-gray-500 text-lg mb-2">No job selected</div>
        <div className="text-gray-400 text-sm">Open from a job or use /assessments/:jobId/submissions</div>
      </div>
    );
  }

  if (isLoading) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="text-lg text-gray-600">Loading submissions...</div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="text-center text-red-600 p-4">Error loading submissions: {error.message}</div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-gray-900">Submissions</h2>
          {job && <div className="text-gray-600">Job: {job.title}</div>}
        </div>
        <button onClick={() => navigate(`/assessments/${jobId}`)} className="px-4 py-2 border rounded-lg hover:bg-gray-50">↩ Back to Assessment</button>
      </div>

      {submissions.length === 0 ? (
        <div className="text-center py-12 text-gray-500">No submissions yet</div>
      ) : (
        <div className="bg-white rounded-lg shadow-sm border overflow-hidden">
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Candidate</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Submitted</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Summary</th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {submissions.map((s) => {
                  const answered = s.responses ? Object.keys(s.responses).length : 0;
                  return (
                    <tr key={s.id} className="hover:bg-gray-50">
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{s.candidateId}</td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{new Date(s.submittedAt).toLocaleString()}</td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{answered} answers</td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}

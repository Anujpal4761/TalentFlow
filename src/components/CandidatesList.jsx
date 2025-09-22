import React, { useState, useMemo, useEffect, useRef, useCallback } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useNavigate } from 'react-router-dom';
import { candidatesAPI } from '../utils/api';
import { seedData } from '../utils/indexedDB';

export default function CandidatesList({ onCandidateSelect, selectedCandidateId }) {
  const [filters, setFilters] = useState({
    search: '',
    stage: 'all'
  });

  const queryClient = useQueryClient();
  const navigate = useNavigate();

  // Ensure data is seeded or topped up to >= 1000 candidates when this page mounts
  useEffect(() => {
    const seed = async () => {
      try {
        await seedData();
        // Refresh candidates query after potential top-up
        queryClient.invalidateQueries(['candidates']);
      } catch (e) {
        console.error('Error seeding candidates:', e);
      }
    };
    seed();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Fetch candidates with API
  const { data: candidatesResponse, isLoading, error } = useQuery({
    queryKey: ['candidates', filters, 'virtualized'],
    queryFn: () => candidatesAPI.getCandidates({
      search: filters.search,
      stage: filters.stage === 'all' ? '' : filters.stage,
      page: 1,
      pageSize: 1000
    }),
    staleTime: 1000 * 60 * 5,
    retry: (failureCount, error) => {
      // Don't retry if it's an HTML response (MSW not working)
      if (error?.message?.includes('Unexpected token') || error?.message?.includes('<!DOCTYPE')) {
        return false;
      }
      return failureCount < 3;
    },
  });

  // Sample fallback data in case API completely fails
  const getFallbackCandidates = () => {
    const sampleCandidates = [];
    const stages = ["applied", "screen", "tech", "offer", "hired", "rejected"];
    const names = ["John Doe", "Jane Smith", "Mike Johnson", "Sarah Wilson", "David Brown"];

    for (let i = 1; i <= 50; i++) {
      sampleCandidates.push({
        id: `fallback-${i}`,
        name: names[i % names.length],
        email: `candidate${i}@example.com`,
        stage: stages[i % stages.length],
        jobId: "1",
        appliedDate: new Date(Date.now() - Math.random() * 30 * 24 * 60 * 60 * 1000).toISOString(),
      });
    }
    return sampleCandidates;
  };

  // Use fallback data if API fails completely
  const allCandidates = candidatesResponse?.data || (error ? getFallbackCandidates() : []);
  const total = allCandidates.length;

  // Virtualization state and calculations
  const scrollTopRef = useRef(0);
  const viewportHeight = 600; // fallback px height; container also uses 70vh
  const rowHeight = 64; // px — keep this in sync with the CSS height on table rows (h-16)

  // Minimal state for triggering re-renders
  const [scrollPosition, setScrollPosition] = useState(0);

  // Memoized virtualization calculations
  const virtualization = useMemo(() => {
    const scrollTop = scrollTopRef.current;
    const startIndex = Math.max(0, Math.floor(scrollTop / rowHeight));
    const visibleCount = Math.ceil(viewportHeight / rowHeight) + 10; // buffer
    const endIndex = Math.min(total, startIndex + visibleCount);
    const topPadding = startIndex * rowHeight;
    const bottomPadding = Math.max(0, (total - endIndex) * rowHeight);
    return {
      startIndex,
      endIndex,
      topPadding,
      bottomPadding,
      visibleItems: allCandidates.slice(startIndex, endIndex)
    };
  }, [total, allCandidates, scrollPosition]);

  // Destructure virtualization values
  const { topPadding, bottomPadding, visibleItems } = virtualization;

  // Optimized scroll handler with throttling
  const handleScrollOptimized = useCallback((e) => {
    const scrollTop = e.currentTarget.scrollTop;
    // Only update if scroll position has changed significantly (every 16px)
    if (Math.abs(scrollTop - scrollTopRef.current) > 16) {
      scrollTopRef.current = scrollTop;
      // Force a minimal re-render
      setScrollPosition(scrollTop);
    }
  }, []);

  // Update candidate stage mutation
  const updateCandidateMutation = useMutation({
    mutationFn: async ({ candidateId, newStage, oldStage }) => {
      return candidatesAPI.updateCandidate(candidateId, { stage: newStage });
    },
    onSuccess: () => {
      queryClient.invalidateQueries(['candidates']);
    },
    onError: (error) => {
      console.error('Error updating candidate:', error);
      alert('Failed to update candidate stage. Please try again.');
    }
  });

  const handleStageChange = (candidateId, newStage) => {
    const candidate = allCandidates.find(c => c.id === candidateId);
    if (candidate && candidate.stage !== newStage) {
      updateCandidateMutation.mutate({
        candidateId,
        newStage,
        oldStage: candidate.stage
      });
    }
  };

  const handleCandidateClick = (candidateId) => {
    navigate(`/candidates/${candidateId}`);
  };

  const stages = [
    { value: 'applied', label: 'Applied', color: 'bg-blue-100 text-blue-600' },
    { value: 'screen', label: 'Screening', color: 'bg-yellow-100 text-yellow-600' },
    { value: 'tech', label: 'Technical', color: 'bg-purple-100 text-purple-600' },
    { value: 'offer', label: 'Offer', color: 'bg-green-100 text-green-600' },
    { value: 'hired', label: 'Hired', color: 'bg-emerald-100 text-emerald-600' },
    { value: 'rejected', label: 'Rejected', color: 'bg-red-100 text-red-600' }
  ];

  const getStageInfo = (stage) => {
    return stages.find(s => s.value === stage) || { label: stage, color: 'bg-gray-100 text-gray-600' };
  };

  if (isLoading) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="text-lg text-gray-600">Loading candidates...</div>
      </div>
    );
  }

  if (error) {
    console.error('Candidates API Error:', error);
    return (
      <div className="text-center text-red-600 p-4">
        <div className="text-lg font-semibold mb-2">Error loading candidates</div>
        <div className="text-sm text-gray-400 mb-4">{error.message}</div>
        <div className="text-xs text-gray-500 mb-4">
          This might be due to MSW (Mock Service Worker) not being properly registered.
          Check the browser console for more details.
        </div>
        <button
          onClick={() => window.location.reload()}
          className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 text-sm"
        >
          Refresh Page (Fix MSW)
        </button>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <h2 className="text-2xl font-bold text-white">Candidates ({total})</h2>
      </div>

      {/* Filters */}
      <div className="bg-gray-800 p-4 rounded-lg shadow-sm border border-gray-700 space-y-4">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-100 mb-1">
              Search
            </label>
            <input
              type="text"
              value={filters.search}
              onChange={(e) => {
                setFilters({ ...filters, search: e.target.value });
              }}
              placeholder="Search by name or email..."
              className="w-full px-3 py-2 border border-gray-700 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 bg-gray-900 text-gray-100 placeholder-gray-500"
            />
          </div>
          
          <div>
            <label className="block text-sm font-medium text-gray-100 mb-1">
              Stage
            </label>
            <select
              value={filters.stage}
              onChange={(e) => {
                setFilters({ ...filters, stage: e.target.value });
              }}
              className="w-full px-3 py-2 border border-gray-700 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 bg-gray-900 text-gray-100"
            >
              <option value="all">All Stages</option>
              {stages.map(stage => (
                <option key={stage.value} value={stage.value}>
                  {stage.label}
                </option>
              ))}
            </select>
          </div>
        </div>
      </div>

      {/* Candidates List (Virtualized) */}
      <div className="bg-gray-800 rounded-lg shadow-sm border border-gray-700 overflow-hidden">
        <div className="overflow-x-auto">
          <div
            style={{ height: `${viewportHeight}px`, maxHeight: '70vh', overflowY: 'auto' }}
            onScroll={handleScrollOptimized}
          >
          <table className="min-w-full divide-y divide-gray-200 table-fixed">
            <thead className="bg-gray-800 sticky top-0 z-10">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-300 uppercase tracking-wider">
                  Candidate
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-300 uppercase tracking-wider">
                  Stage
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-300 uppercase tracking-wider">
                  Applied Date
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-300 uppercase tracking-wider">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody className="bg-gray-800 divide-y divide-gray-700">
              {/* top padding row */}
              {topPadding > 0 && (
                <tr style={{ height: `${topPadding}px` }}><td colSpan={4} /></tr>
              )}
              {visibleItems.map((candidate) => {
                const stageInfo = getStageInfo(candidate.stage);
                return (
                  <tr
                    key={candidate.id}
                    className={`h-16 align-middle hover:bg-gray-700 cursor-pointer ${
                      selectedCandidateId === candidate.id ? 'bg-blue-900/40 border-blue-500' : ''
                    }`}
                    onClick={() => handleCandidateClick(candidate.id)}
                  >
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div>
                        <div className="text-sm font-medium text-gray-100">
                          {candidate.name}
                        </div>
                        <div className="text-sm text-gray-400">
                          {candidate.email}
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <select
                        value={candidate.stage}
                        onChange={(e) => {
                          e.stopPropagation();
                          handleStageChange(candidate.id, e.target.value);
                        }}
                        onClick={(e) => e.stopPropagation()}
                        onMouseDown={(e) => e.stopPropagation()}
                        onKeyDown={(e) => e.stopPropagation()}
                        className={`px-2 py-1 text-xs font-medium rounded-full border-0 ${stageInfo.color}`}
                        disabled={updateCandidateMutation.isLoading}
                      >
                        {stages.map(stage => (
                          <option key={stage.value} value={stage.value}>
                            {stage.label}
                          </option>
                        ))}
                      </select>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-300">
                      {new Date(candidate.appliedDate).toLocaleDateString()}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          handleCandidateClick(candidate.id);
                        }}
                        className="text-blue-400 hover:text-blue-300"
                      >
                        View Details
                      </button>
                    </td>
                  </tr>
                );
              })}
              {/* bottom padding row */}
              {bottomPadding > 0 && (
                <tr style={{ height: `${bottomPadding}px` }}><td colSpan={4} /></tr>
              )}
            </tbody>
          </table>
          </div>
        </div>
      </div>

      {/* Empty State */}
      {allCandidates.length === 0 && (
        <div className="text-center py-12">
          <div className="text-gray-500 text-lg mb-2">No candidates found</div>
          <div className="text-gray-400 text-sm">
            {filters.search || filters.stage !== 'all' 
              ? 'Try adjusting your filters' 
              : 'Candidates will appear here once added'
            }
          </div>
        </div>
      )}
    </div>
  );
}
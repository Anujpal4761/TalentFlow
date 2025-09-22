import React, { useState, useMemo } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { candidatesAPI } from '../utils/api';

export default function KanbanBoard() {
  const [draggedCandidate, setDraggedCandidate] = useState(null);
  const [dragOverStage, setDragOverStage] = useState(null);

  const queryClient = useQueryClient();

  // Fetch candidates
  const { data: candidatesResponse, isLoading, error } = useQuery({
    queryKey: ['candidates', 'kanban'],
    queryFn: () => candidatesAPI.getCandidates({ pageSize: 1000 }), // Get all candidates for kanban
    staleTime: 1000 * 60 * 5,
  });

  const allCandidates = candidatesResponse?.data || [];

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
      alert('Failed to move candidate. Please try again.');
    }
  });

  const stages = [
    { 
      id: 'applied', 
      title: 'Applied', 
      color: 'bg-gray-800 border-blue-500',
      headerColor: 'bg-blue-900 text-blue-200'
    },
    { 
      id: 'screen', 
      title: 'Screening', 
      color: 'bg-gray-800 border-yellow-500',
      headerColor: 'bg-yellow-900 text-yellow-200'
    },
    { 
      id: 'tech', 
      title: 'Technical', 
      color: 'bg-gray-800 border-purple-500',
      headerColor: 'bg-purple-900 text-purple-200'
    },
    { 
      id: 'offer', 
      title: 'Offer', 
      color: 'bg-gray-800 border-green-500',
      headerColor: 'bg-green-900 text-green-200'
    },
    { 
      id: 'hired', 
      title: 'Hired', 
      color: 'bg-gray-800 border-emerald-500',
      headerColor: 'bg-emerald-900 text-emerald-200'
    },
    { 
      id: 'rejected', 
      title: 'Rejected', 
      color: 'bg-gray-800 border-red-500',
      headerColor: 'bg-red-900 text-red-200'
    }
  ];

  // Group candidates by stage
  const candidatesByStage = useMemo(() => {
    const grouped = {};
    stages.forEach(stage => {
      grouped[stage.id] = allCandidates.filter(candidate => candidate.stage === stage.id);
    });
    return grouped;
  }, [allCandidates]);

  const handleDragStart = (e, candidate) => {
    setDraggedCandidate(candidate);
    e.dataTransfer.effectAllowed = 'move';
  };

  const handleDragOver = (e, stageId) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = 'move';
    setDragOverStage(stageId);
  };

  const handleDragLeave = () => {
    setDragOverStage(null);
  };

  const handleDrop = (e, stageId) => {
    e.preventDefault();
    setDragOverStage(null);
    
    if (draggedCandidate && draggedCandidate.stage !== stageId) {
      updateCandidateMutation.mutate({
        candidateId: draggedCandidate.id,
        newStage: stageId,
        oldStage: draggedCandidate.stage
      });
    }
    setDraggedCandidate(null);
  };

  if (isLoading) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="text-lg text-gray-400">Loading candidates...</div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="text-center text-red-400 p-4">
        Error loading candidates: {error.message}
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <h2 className="text-2xl font-bold text-white">Candidate Pipeline</h2>
        <div className="text-sm text-gray-400">
          Total: {allCandidates.length} candidates
        </div>
      </div>

      {/* Kanban Board */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 gap-4 min-h-[600px]">
        {stages.map((stage) => {
          const candidates = candidatesByStage[stage.id] || [];
          const isDragOver = dragOverStage === stage.id;
          
          return (
            <div
              key={stage.id}
              className={`rounded-lg border-2 ${stage.color} ${
                isDragOver ? 'border-dashed border-blue-400 bg-gray-700' : ''
              } transition-colors`}
              onDragOver={(e) => handleDragOver(e, stage.id)}
              onDragLeave={handleDragLeave}
              onDrop={(e) => handleDrop(e, stage.id)}
            >
              {/* Stage Header */}
              <div className={`px-4 py-3 rounded-t-lg ${stage.headerColor} border-b`}>
                <div className="flex justify-between items-center">
                  <h3 className="font-semibold text-sm">{stage.title}</h3>
                  <span className="text-xs font-medium bg-gray-800 bg-opacity-50 px-2 py-1 rounded-full">
                    {candidates.length}
                  </span>
                </div>
              </div>

              {/* Candidates */}
              <div className="p-3 space-y-3 min-h-[500px]">
                {candidates.map((candidate) => (
                  <CandidateCard
                    key={candidate.id}
                    candidate={candidate}
                    onDragStart={(e) => handleDragStart(e, candidate)}
                    isDragging={draggedCandidate?.id === candidate.id}
                  />
                ))}
                
                {candidates.length === 0 && (
                  <div className="text-center text-gray-500 text-sm py-8">
                    No candidates in this stage
                  </div>
                )}
              </div>
            </div>
          );
        })}
      </div>

      {/* Instructions */}
      <div className="bg-gray-800 border border-gray-700 rounded-lg p-4">
        <div className="flex items-start">
          <div className="text-blue-400 mr-3">💡</div>
          <div>
            <h4 className="text-blue-200 font-medium mb-1">How to use the Kanban board</h4>
            <p className="text-gray-300 text-sm">
              Drag and drop candidates between stages to update their status.
              Changes are automatically saved and tracked in the candidate timeline.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}

// Candidate Card Component
function CandidateCard({ candidate, onDragStart, isDragging }) {
  const getDaysAgo = (dateString) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffTime = Math.abs(now - date);
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    return diffDays;
  };

  return (
    <div
      draggable
      onDragStart={onDragStart}
      className={`bg-gray-800 rounded-lg shadow-sm border border-gray-700 p-3 cursor-move transition-all hover:shadow-md ${
        isDragging ? 'opacity-50 rotate-2' : ''
      }`}
    >
      <div className="space-y-2">
        <div>
          <h4 className="font-medium text-gray-100 text-sm truncate">
            {candidate.name}
          </h4>
          <p className="text-xs text-gray-400 truncate">
            {candidate.email}
          </p>
        </div>
        
        <div className="flex justify-between items-center text-xs text-gray-500">
          <span>Applied {getDaysAgo(candidate.appliedDate)}d ago</span>
          <span className="text-gray-600">⋮⋮</span>
        </div>
      </div>
    </div>
  );
}
import React, { useState, useRef, useEffect } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { candidatesAPI } from '../utils/api';

export default function CandidateDetail({ candidateId, onBack }) {
  const [newNote, setNewNote] = useState('');
  const [isAddingNote, setIsAddingNote] = useState(false);
  const [showMentions, setShowMentions] = useState(false);
  const [mentionPosition, setMentionPosition] = useState({ top: 0, left: 0 });
  const [mentionQuery, setMentionQuery] = useState('');
  const textareaRef = useRef(null);

  const queryClient = useQueryClient();

  // Mock user list for @mentions
  const users = [
    { id: '1', name: 'John Doe', username: 'john.doe' },
    { id: '2', name: 'Jane Smith', username: 'jane.smith' },
    { id: '3', name: 'Mike Johnson', username: 'mike.johnson' },
    { id: '4', name: 'Sarah Wilson', username: 'sarah.wilson' },
    { id: '5', name: 'David Brown', username: 'david.brown' },
  ];

  // Fetch candidate details
  const { data: candidate, isLoading: candidateLoading } = useQuery({
    queryKey: ['candidate', candidateId],
    queryFn: () => candidatesAPI.getCandidate(candidateId),
    enabled: !!candidateId
  });

  // Fetch candidate timeline
  const { data: timeline = [], isLoading: timelineLoading } = useQuery({
    queryKey: ['timeline', candidateId],
    queryFn: () => candidatesAPI.getCandidateTimeline(candidateId),
    enabled: !!candidateId
  });

  // Add note mutation
  const addNoteMutation = useMutation({
    mutationFn: async (note) => {
      return candidatesAPI.addNote(candidateId, note);
    },
    onSuccess: () => {
      queryClient.invalidateQueries(['timeline', candidateId]);
      setNewNote('');
      setIsAddingNote(false);
    },
    onError: (error) => {
      console.error('Error adding note:', error);
      alert('Failed to add note. Please try again.');
    }
  });

  // Update candidate stage mutation
  const updateStageMutation = useMutation({
    mutationFn: async (newStage) => {
      return candidatesAPI.updateCandidate(candidateId, { stage: newStage });
    },
    onSuccess: () => {
      queryClient.invalidateQueries(['candidate', candidateId]);
      queryClient.invalidateQueries(['timeline', candidateId]);
      queryClient.invalidateQueries(['candidates']);
    },
    onError: (error) => {
      console.error('Error updating candidate:', error);
      alert('Failed to update candidate stage. Please try again.');
    }
  });

  const stages = [
    { value: 'applied', label: 'Applied', color: 'bg-blue-100 text-blue-800' },
    { value: 'screen', label: 'Screening', color: 'bg-yellow-100 text-yellow-800' },
    { value: 'tech', label: 'Technical', color: 'bg-purple-100 text-purple-800' },
    { value: 'offer', label: 'Offer', color: 'bg-green-100 text-green-800' },
    { value: 'hired', label: 'Hired', color: 'bg-emerald-100 text-emerald-800' },
    { value: 'rejected', label: 'Rejected', color: 'bg-red-100 text-red-800' }
  ];

  const getStageInfo = (stage) => {
    return stages.find(s => s.value === stage) || { label: stage, color: 'bg-gray-100 text-gray-800' };
  };

  // Handle @mentions
  const handleNoteChange = (e) => {
    const value = e.target.value;
    setNewNote(value);
    
    const cursorPosition = e.target.selectionStart;
    const textBeforeCursor = value.substring(0, cursorPosition);
    const lastAtIndex = textBeforeCursor.lastIndexOf('@');
    
    if (lastAtIndex !== -1) {
      const textAfterAt = textBeforeCursor.substring(lastAtIndex + 1);
      if (!textAfterAt.includes(' ') && !textAfterAt.includes('\n')) {
        setMentionQuery(textAfterAt);
        setShowMentions(true);
        
        // Position the mentions dropdown
        const rect = e.target.getBoundingClientRect();
        setMentionPosition({
          top: rect.bottom + window.scrollY,
          left: rect.left + window.scrollX
        });
      } else {
        setShowMentions(false);
      }
    } else {
      setShowMentions(false);
    }
  };

  const handleMentionSelect = (user) => {
    const cursorPosition = textareaRef.current.selectionStart;
    const textBeforeCursor = newNote.substring(0, cursorPosition);
    const lastAtIndex = textBeforeCursor.lastIndexOf('@');
    const textAfterCursor = newNote.substring(cursorPosition);
    
    const newText = 
      newNote.substring(0, lastAtIndex) + 
      `@${user.username} ` + 
      textAfterCursor;
    
    setNewNote(newText);
    setShowMentions(false);
    
    // Focus back to textarea
    setTimeout(() => {
      textareaRef.current.focus();
      const newCursorPosition = lastAtIndex + user.username.length + 2;
      textareaRef.current.setSelectionRange(newCursorPosition, newCursorPosition);
    }, 0);
  };

  const handleAddNote = () => {
    if (!newNote.trim()) return;
    addNoteMutation.mutate(newNote.trim());
  };

  const handleStageChange = (newStage) => {
    if (candidate && candidate.stage !== newStage) {
      updateStageMutation.mutate(newStage);
    }
  };

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleString();
  };

  const getTimelineIcon = (action) => {
    switch (action) {
      case 'stage_change':
        return '🔄';
      case 'note_added':
        return '📝';
      default:
        return '📋';
    }
  };

  if (candidateLoading) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="text-lg text-gray-400">Loading candidate details...</div>
      </div>
    );
  }

  if (!candidate) {
    return (
      <div className="text-center py-12">
        <div className="text-gray-400 text-lg mb-2">Candidate not found</div>
        <button
          onClick={onBack}
          className="text-blue-400 hover:text-blue-300"
        >
          ← Back to candidates
        </button>
      </div>
    );
  }

  const currentStageInfo = getStageInfo(candidate.stage);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-4">
          <button
            onClick={onBack}
            className="text-gray-400 hover:text-gray-100"
          >
            ← Back
          </button>
          <h2 className="text-2xl font-bold text-white">Candidate Profile</h2>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Candidate Info */}
        <div className="lg:col-span-1">
          <div className="bg-gray-800 rounded-lg shadow-sm border border-gray-700 p-6 space-y-4">
            <div className="text-center">
              <div className="w-20 h-20 bg-gray-700 rounded-full mx-auto mb-4 flex items-center justify-center text-2xl font-bold text-gray-100">
                {candidate.name.charAt(0).toUpperCase()}
              </div>
              <h3 className="text-xl font-semibold text-gray-100">{candidate.name}</h3>
              <p className="text-gray-400">{candidate.email}</p>
            </div>

            <div className="space-y-3">
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-1">
                  Current Stage
                </label>
                <select
                  value={candidate.stage}
                  onChange={(e) => handleStageChange(e.target.value)}
                  disabled={updateStageMutation.isLoading}
                  className={`w-full px-3 py-2 rounded-md text-sm font-medium ${currentStageInfo.color} border-0`}
                >
                  {stages.map(stage => (
                    <option key={stage.value} value={stage.value}>
                      {stage.label}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-300 mb-1">
                  Applied Date
                </label>
                <p className="text-sm text-gray-400">
                  {formatDate(candidate.appliedDate)}
                </p>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-300 mb-1">
                  Job ID
                </label>
                <p className="text-sm text-gray-400">{candidate.jobId}</p>
              </div>
            </div>
          </div>
        </div>

        {/* Timeline and Notes */}
        <div className="lg:col-span-2">
          <div className="bg-gray-800 rounded-lg shadow-sm border border-gray-700 p-6">
            <div className="flex justify-between items-center mb-6">
              <h3 className="text-lg font-semibold text-gray-100">Timeline & Notes</h3>
              <button
                onClick={() => setIsAddingNote(!isAddingNote)}
                className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 text-sm"
              >
                + Add Note
              </button>
            </div>

            {/* Add Note Form */}
            {isAddingNote && (
              <div className="mb-6 p-4 bg-gray-700 rounded-lg relative">
                <textarea
                  ref={textareaRef}
                  value={newNote}
                  onChange={handleNoteChange}
                  placeholder="Add a note about this candidate... Use @ to mention someone"
                  rows={3}
                  className="w-full px-3 py-2 border border-gray-600 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 bg-gray-900 text-gray-100 placeholder-gray-500"
                />
                
                {/* @Mentions Dropdown */}
                {showMentions && (
                  <div 
                    className="absolute z-10 bg-gray-800 border border-gray-600 rounded-lg shadow-lg max-h-40 overflow-y-auto"
                    style={{
                      top: mentionPosition.top + 10,
                      left: mentionPosition.left,
                      minWidth: '200px'
                    }}
                  >
                    {users
                      .filter(user => 
                        user.username.toLowerCase().includes(mentionQuery.toLowerCase()) ||
                        user.name.toLowerCase().includes(mentionQuery.toLowerCase())
                      )
                      .map(user => (
                        <div
                          key={user.id}
                          onClick={() => handleMentionSelect(user)}
                          className="px-3 py-2 hover:bg-gray-700 cursor-pointer border-b border-gray-600 last:border-b-0"
                        >
                          <div className="font-medium text-sm text-gray-100">{user.name}</div>
                          <div className="text-xs text-gray-400">@{user.username}</div>
                        </div>
                      ))
                    }
                    {users.filter(user => 
                      user.username.toLowerCase().includes(mentionQuery.toLowerCase()) ||
                      user.name.toLowerCase().includes(mentionQuery.toLowerCase())
                    ).length === 0 && (
                      <div className="px-3 py-2 text-gray-500 text-sm">
                        No users found
                      </div>
                    )}
                  </div>
                )}
                
                <div className="flex justify-end space-x-2 mt-3">
                  <button
                    onClick={() => {
                      setIsAddingNote(false);
                      setNewNote('');
                      setShowMentions(false);
                    }}
                    className="px-3 py-1 text-gray-400 hover:text-gray-100 text-sm"
                  >
                    Cancel
                  </button>
                  <button
                    onClick={handleAddNote}
                    disabled={!newNote.trim() || addNoteMutation.isLoading}
                    className="px-3 py-1 bg-blue-600 text-white rounded hover:bg-blue-700 disabled:opacity-50 text-sm"
                  >
                    {addNoteMutation.isLoading ? 'Adding...' : 'Add Note'}
                  </button>
                </div>
              </div>
            )}

            {/* Timeline */}
            <div className="space-y-4">
              {timelineLoading ? (
                <div className="text-center py-8 text-gray-400">
                  Loading timeline...
                </div>
              ) : timeline.length === 0 ? (
                <div className="text-center py-8 text-gray-400">
                  No timeline entries yet
                </div>
              ) : (
                timeline
                  .sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp))
                  .map((entry, index) => (
                    <div key={entry.id || index} className="flex space-x-3">
                      <div className="flex-shrink-0">
                        <div className="w-8 h-8 bg-gray-700 rounded-full flex items-center justify-center text-sm">
                          {getTimelineIcon(entry.action)}
                        </div>
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="text-sm text-gray-100">
                          {entry.details}
                        </div>
                        <div className="text-xs text-gray-400 mt-1">
                          {formatDate(entry.timestamp)}
                        </div>
                        {entry.note && (
                          <div className="mt-2 p-3 bg-yellow-900/20 border border-yellow-700 rounded text-sm text-gray-100">
                            {entry.note}
                          </div>
                        )}
                      </div>
                    </div>
                  ))
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
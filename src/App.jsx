import React, { useState, useEffect } from "react";
import { BrowserRouter as Router, Routes, Route, useParams, useNavigate } from "react-router-dom";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import JobsBoard from "./components/JobsBoard";
import CandidatesList from "./components/CandidatesList";
import AssessmentBuilder from "./components/AssessmentBuilder";
import KanbanBoard from "./components/KanbanBoard";
import CandidateDetail from "./components/CandidateDetail";
import JobDetail from "./components/JobDetail";
import Navigation from "./components/Navigation";
import SubmissionsList from "./components/SubmissionsList";
import { initializeDB, seedData } from "./utils/indexedDB";

// Create React Query client
const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 1000 * 60 * 5, // 5 minutes
      cacheTime: 1000 * 60 * 30, // 30 minutes
      retry: 1,
      refetchOnWindowFocus: false,
    },
  },
});

// Job Detail Route Component
function JobDetailRoute() {
  const { jobId } = useParams();
  const navigate = useNavigate();
  
  return (
    <JobDetail 
      jobId={jobId} 
      onBack={() => navigate('/jobs')}
    />
  );
}

// Candidate Detail Route Component
function CandidateDetailRoute() {
  const { candidateId } = useParams();
  const navigate = useNavigate();
  
  return (
    <CandidateDetail 
      candidateId={candidateId} 
      onBack={() => navigate('/candidates')}
    />
  );
}

// Main App Component
function App() {
  useEffect(() => {
    // Initialize IndexedDB and seed data
    const initData = async () => {
      try {
        await initializeDB();
        await seedData();
      } catch (error) {
        console.error("Error initializing data:", error);
      }
    };
    initData();
  }, []);

  return (
    <QueryClientProvider client={queryClient}>
      <Router>
        <div className="min-h-screen bg-gray-900 text-gray-100">
          <header className="bg-gray-800 border-b border-gray-700">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
              <div className="flex justify-between items-center py-4">
                <h1 className="text-2xl font-bold text-gray-100">TalentFlow</h1>
                <Navigation />
              </div>
            </div>
          </header>

          <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
            <Routes>
              <Route path="/" element={<JobsBoard />} />
              <Route path="/jobs" element={<JobsBoard />} />
              <Route path="/jobs/:jobId" element={<JobDetailRoute />} />
              <Route path="/candidates" element={<CandidatesList />} />
              <Route path="/candidates/:candidateId" element={<CandidateDetailRoute />} />
              <Route path="/kanban" element={<KanbanBoard />} />
              <Route path="/assessments" element={<AssessmentBuilder />} />
              <Route path="/assessments/:jobId" element={<AssessmentBuilder />} />
              <Route path="/assessments/:jobId/submissions" element={<SubmissionsList />} />
            </Routes>
          </main>
        </div>
      </Router>
    </QueryClientProvider>
  );
}

export default App;

import { http, HttpResponse } from 'msw';
import {
  initializeDB,
  getJobs as idbGetJobs,
  saveJob as idbSaveJob,
  getJob as idbGetJob,
  deleteJob as idbDeleteJob,
  getCandidates as idbGetCandidates,
  saveCandidate as idbSaveCandidate,
  getCandidate as idbGetCandidate,
  addTimelineEntry as idbAddTimelineEntry,
  getCandidateTimeline as idbGetCandidateTimeline,
  saveAssessment as idbSaveAssessment,
  getAssessment as idbGetAssessment,
  saveSubmission as idbSaveSubmission,
  getSubmissionsByJob as idbGetSubmissionsByJob,
} from '../utils/indexedDB';

// Simulate artificial latency
const delay = (ms) => new Promise(resolve => setTimeout(resolve, ms));

// Simulate error rate (5-10% on write endpoints)
const shouldSimulateError = () => Math.random() < 0.08; // 8% error rate

// Simulate latency (200-1200ms)
const getLatency = () => Math.floor(Math.random() * 1000) + 200;

// Ensure DB is ready for handlers
await initializeDB();

export const handlers = [
  // Jobs endpoints
  http.get('/api/jobs', async ({ request }) => {
    await delay(getLatency());
    const url = new URL(request.url);
    const search = url.searchParams.get('search') || '';
    const status = url.searchParams.get('status') || 'all';
    const page = parseInt(url.searchParams.get('page')) || 1;
    const pageSize = parseInt(url.searchParams.get('pageSize')) || 10;
    const sort = url.searchParams.get('sort') || 'order';
    const tagsParam = url.searchParams.get('tags') || '';
    const tagFilters = tagsParam
      .split(',')
      .map(t => t.trim().toLowerCase())
      .filter(Boolean);

    const allJobs = await idbGetJobs();
    let filteredJobs = allJobs.filter(job => {
      const matchesSearch = !search || 
        job.title.toLowerCase().includes(search.toLowerCase()) ||
        job.slug.toLowerCase().includes(search.toLowerCase());
      
      const matchesStatus = status === 'all' || job.status === status;
      const matchesTags =
        tagFilters.length === 0 ||
        (Array.isArray(job.tags) && tagFilters.every(tf => job.tags.some(tag => String(tag).toLowerCase() === tf)));
      
      return matchesSearch && matchesStatus && matchesTags;
    });

    // Sort
    if (sort === 'order') {
      filteredJobs.sort((a, b) => a.order - b.order);
    } else if (sort === 'title') {
      filteredJobs.sort((a, b) => a.title.localeCompare(b.title));
    }

    // Paginate
    const startIndex = (page - 1) * pageSize;
    const endIndex = startIndex + pageSize;
    const paginatedJobs = filteredJobs.slice(startIndex, endIndex);

    return HttpResponse.json({
      data: paginatedJobs,
      pagination: {
        page,
        pageSize,
        total: filteredJobs.length,
        totalPages: Math.ceil(filteredJobs.length / pageSize)
      }
    });
  }),

  // List submissions for a job
  http.get('/api/assessments/:jobId/submissions', async ({ params }) => {
    await delay(getLatency());
    try {
      const submissions = await idbGetSubmissionsByJob(params.jobId);
      // Sort by submittedAt desc
      const sorted = submissions.sort((a, b) => new Date(b.submittedAt) - new Date(a.submittedAt));
      return HttpResponse.json({ data: sorted });
    } catch (e) {
      console.error('Error reading submissions:', e);
      return HttpResponse.json({ data: [] });
    }
  }),

  http.post('/api/jobs', async ({ request }) => {
    await delay(getLatency());
    
    if (shouldSimulateError()) {
      return HttpResponse.json(
        { error: 'Internal server error' },
        { status: 500 }
      );
    }

    const jobData = await request.json();
    const newJob = {
      id: jobData.id || `job-${Date.now()}`,
      ...jobData,
      order: jobData.order || Date.now(),
    };
    await idbSaveJob(newJob);
    return HttpResponse.json(newJob, { status: 201 });
  }),

  http.patch('/api/jobs/:id', async ({ request, params }) => {
    await delay(getLatency());
    
    if (shouldSimulateError()) {
      return HttpResponse.json(
        { error: 'Internal server error' },
        { status: 500 }
      );
    }

    const jobData = await request.json();
    const existing = await idbGetJob(params.id);
    if (!existing) {
      return HttpResponse.json({ error: 'Job not found' }, { status: 404 });
    }
    const updated = { ...existing, ...jobData };
    await idbSaveJob(updated);
    return HttpResponse.json(updated);
  }),

  http.patch('/api/jobs/:id/reorder', async ({ request, params }) => {
    await delay(getLatency());
    
    if (shouldSimulateError()) {
      return HttpResponse.json(
        { error: 'Reorder failed' },
        { status: 500 }
      );
    }

    const { toOrder } = await request.json();
    const existing = await idbGetJob(params.id);
    if (!existing) {
      return HttpResponse.json({ error: 'Job not found' }, { status: 404 });
    }
    await idbSaveJob({ ...existing, order: toOrder });
    return HttpResponse.json({ success: true });
  }),

  http.delete('/api/jobs/:id', async ({ params }) => {
    await delay(getLatency());
    if (shouldSimulateError()) {
      return HttpResponse.json({ error: 'Internal server error' }, { status: 500 });
    }
    await idbDeleteJob(params.id);
    return HttpResponse.json({ success: true });
  }),

  // Candidates endpoints
  http.get('/api/candidates', async ({ request }) => {
    await delay(getLatency());
    
    const url = new URL(request.url);
    const search = url.searchParams.get('search') || '';
    const stage = url.searchParams.get('stage') || 'all';
    const page = parseInt(url.searchParams.get('page')) || 1;
    const pageSize = parseInt(url.searchParams.get('pageSize')) || 20;

    const allCandidates = await idbGetCandidates();
    let filteredCandidates = allCandidates.filter(candidate => {
      const matchesSearch = !search || 
        candidate.name.toLowerCase().includes(search.toLowerCase()) ||
        candidate.email.toLowerCase().includes(search.toLowerCase());
      
      const matchesStage = stage === 'all' || candidate.stage === stage;
      
      return matchesSearch && matchesStage;
    });

    // Paginate
    const startIndex = (page - 1) * pageSize;
    const endIndex = startIndex + pageSize;
    const paginatedCandidates = filteredCandidates.slice(startIndex, endIndex);

    return HttpResponse.json({
      data: paginatedCandidates,
      pagination: {
        page,
        pageSize,
        total: filteredCandidates.length,
        totalPages: Math.ceil(filteredCandidates.length / pageSize)
      }
    });
  }),

  // Get a single candidate by ID
  http.get('/api/candidates/:id', async ({ params }) => {
    await delay(getLatency());
    const candidate = await idbGetCandidate(params.id);
    if (!candidate) {
      return HttpResponse.json({ error: 'Candidate not found' }, { status: 404 });
    }
    return HttpResponse.json(candidate);
  }),

  http.post('/api/candidates', async ({ request }) => {
    await delay(getLatency());
    
    if (shouldSimulateError()) {
      return HttpResponse.json(
        { error: 'Internal server error' },
        { status: 500 }
      );
    }

    const candidateData = await request.json();
    const newCandidate = {
      id: candidateData.id || `candidate-${Date.now()}`,
      ...candidateData,
      appliedDate: new Date().toISOString(),
    };
    await idbSaveCandidate(newCandidate);
    await idbAddTimelineEntry({
      candidateId: newCandidate.id,
      action: 'application_received',
      details: 'Application received',
    });
    return HttpResponse.json(newCandidate, { status: 201 });
  }),

  http.patch('/api/candidates/:id', async ({ request, params }) => {
    await delay(getLatency());
    
    if (shouldSimulateError()) {
      return HttpResponse.json(
        { error: 'Internal server error' },
        { status: 500 }
      );
    }

    const candidateData = await request.json();
    const existing = await idbGetCandidate(params.id);
    if (!existing) {
      return HttpResponse.json({ error: 'Candidate not found' }, { status: 404 });
    }
    const oldStage = existing.stage;
    const updated = { ...existing, ...candidateData };
    await idbSaveCandidate(updated);
    if (candidateData.stage && candidateData.stage !== oldStage) {
      await idbAddTimelineEntry({
        candidateId: params.id,
        action: 'stage_change',
        details: `Stage changed from ${oldStage} to ${candidateData.stage}`,
        fromStage: oldStage,
        toStage: candidateData.stage,
      });
    }
    return HttpResponse.json(updated);
  }),

  http.get('/api/candidates/:id/timeline', async ({ params }) => {
    await delay(getLatency());
    const candidateTimeline = await idbGetCandidateTimeline(params.id);
    const sorted = candidateTimeline.sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp));
    return HttpResponse.json(sorted);
  }),

  // Assessments endpoints
  http.get('/api/assessments/:jobId', async ({ params }) => {
    await delay(getLatency());
    const assessment = await idbGetAssessment(params.jobId);
    if (!assessment) {
      return HttpResponse.json({ error: 'Assessment not found' }, { status: 404 });
    }
    return HttpResponse.json(assessment);
  }),

  http.put('/api/assessments/:jobId', async ({ request, params }) => {
    await delay(getLatency());
    
    if (shouldSimulateError()) {
      return HttpResponse.json(
        { error: 'Internal server error' },
        { status: 500 }
      );
    }

    const assessmentData = await request.json();
    await idbSaveAssessment(assessmentData);
    return HttpResponse.json(assessmentData);
  }),

  http.post('/api/assessments/:jobId/submit', async ({ request, params }) => {
    await delay(getLatency());
    
    if (shouldSimulateError()) {
      return HttpResponse.json(
        { error: 'Internal server error' },
        { status: 500 }
      );
    }

    const submissionData = await request.json();
    const saved = await idbSaveSubmission({
      jobId: params.jobId,
      candidateId: submissionData.candidateId,
      responses: submissionData.responses,
    });
    // Also record in timeline for visibility
    await idbAddTimelineEntry({
      candidateId: submissionData.candidateId,
      action: 'assessment_submitted',
      details: `Assessment submitted for job ${params.jobId}`,
    });
    return HttpResponse.json({ success: true, submissionId: saved.id });
  }),

  // Add note with @mentions
  http.post('/api/candidates/:id/notes', async ({ request, params }) => {
    await delay(getLatency());
    
    if (shouldSimulateError()) {
      return HttpResponse.json(
        { error: 'Internal server error' },
        { status: 500 }
      );
    }

    const { note } = await request.json();
    const processedNote = processMentions(note);
    const entry = await idbAddTimelineEntry({
      candidateId: params.id,
      action: 'note_added',
      details: `Note added: ${processedNote}`,
      note: processedNote,
    });
    return HttpResponse.json(entry);
  }),
];

// Helper function to process @mentions
function processMentions(note) {
  // Simple @mention processing - in a real app, you'd have a user database
  const mentionRegex = /@(\w+)/g;
  return note.replace(mentionRegex, (match, username) => {
    // For demo purposes, just highlight the mention
    return `<span class="mention" data-user="${username}">@${username}</span>`;
  });
}

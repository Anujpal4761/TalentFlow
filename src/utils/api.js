// API utility functions that simulate REST endpoints
// In a real app, these would make actual HTTP requests

const API_BASE_URL = '/api';

// Simulate artificial latency
const delay = (ms) => new Promise(resolve => setTimeout(resolve, ms));

// Simulate error rate (5-10% on write endpoints)
const shouldSimulateError = () => Math.random() < 0.08; // 8% error rate

// Simulate latency (200-1200ms)
const getLatency = () => Math.floor(Math.random() * 1000) + 200;

// Mock data storage
let mockJobs = [];
let mockCandidates = [];
let mockAssessments = {};
let mockTimeline = [];

// Initialize mock data
const initializeMockData = () => {
  // Jobs data
  mockJobs = [
    {
      id: "1",
      title: "Senior Frontend Developer",
      slug: "senior-frontend-developer",
      status: "active",
      tags: ["React", "TypeScript", "CSS"],
      order: 1,
      description: "Looking for an experienced frontend developer to join our team and build amazing user interfaces.",
    },
    {
      id: "2",
      title: "Backend Engineer",
      slug: "backend-engineer",
      status: "active",
      tags: ["Node.js", "Python", "Database"],
      order: 2,
      description: "Seeking a skilled backend engineer to design and implement scalable server-side solutions.",
    },
    {
      id: "3",
      title: "Product Manager",
      slug: "product-manager",
      status: "archived",
      tags: ["Strategy", "Analytics", "Leadership"],
      order: 3,
      description: "Product manager role for our core platform. Drive product strategy and execution.",
    },
    {
      id: "4",
      title: "UX Designer",
      slug: "ux-designer",
      status: "active",
      tags: ["Design", "Figma", "User Research"],
      order: 4,
      description: "Create intuitive and beautiful user experiences for our products.",
    },
    {
      id: "5",
      title: "DevOps Engineer",
      slug: "devops-engineer",
      status: "active",
      tags: ["AWS", "Docker", "Kubernetes"],
      order: 5,
      description: "Build and maintain our cloud infrastructure and deployment pipelines.",
    }
  ];

  // Generate 1000+ candidates
  const firstNames = [
    "John", "Jane", "Michael", "Sarah", "David", "Emily", "Chris", "Lisa", "Robert", "Anna",
    "James", "Maria", "William", "Jennifer", "Richard", "Patricia", "Charles", "Linda", "Joseph", "Barbara",
    "Thomas", "Elizabeth", "Christopher", "Jessica", "Daniel", "Ashley", "Matthew", "Amanda", "Anthony", "Stephanie",
    "Mark", "Dorothy", "Donald", "Helen", "Steven", "Sharon", "Paul", "Michelle", "Andrew", "Laura",
    "Joshua", "Sarah", "Kenneth", "Kimberly", "Kevin", "Deborah", "Brian", "Donna", "George", "Carol"
  ];

  const lastNames = [
    "Smith", "Johnson", "Williams", "Brown", "Jones", "Garcia", "Miller", "Davis", "Rodriguez", "Martinez",
    "Hernandez", "Lopez", "Gonzalez", "Wilson", "Anderson", "Thomas", "Taylor", "Moore", "Jackson", "Martin",
    "Lee", "Perez", "Thompson", "White", "Harris", "Sanchez", "Clark", "Ramirez", "Lewis", "Robinson",
    "Walker", "Young", "Allen", "King", "Wright", "Scott", "Torres", "Nguyen", "Hill", "Flores"
  ];

  const stages = ["applied", "screen", "tech", "offer", "hired", "rejected"];

  mockCandidates = [];
  for (let i = 1; i <= 1000; i++) {
    const firstName = firstNames[Math.floor(Math.random() * firstNames.length)];
    const lastName = lastNames[Math.floor(Math.random() * lastNames.length)];
    const name = `${firstName} ${lastName}`;
    const email = `${firstName.toLowerCase()}.${lastName.toLowerCase()}${i}@example.com`;

    mockCandidates.push({
      id: `candidate-${i}`,
      name: name,
      email: email,
      stage: stages[Math.floor(Math.random() * stages.length)],
      jobId: mockJobs[Math.floor(Math.random() * mockJobs.length)].id,
      appliedDate: new Date(Date.now() - Math.random() * 90 * 24 * 60 * 60 * 1000).toISOString(),
    });

    // Add initial timeline entry
    mockTimeline.push({
      id: `timeline-${i}-1`,
      candidateId: `candidate-${i}`,
      action: "application_received",
      details: `Application received for ${mockJobs[Math.floor(Math.random() * mockJobs.length)].title}`,
      timestamp: new Date(Date.now() - Math.random() * 90 * 24 * 60 * 60 * 1000).toISOString(),
    });
  }

  // Sample assessments
  mockAssessments = {
    "1": {
      jobId: "1",
      title: "Senior Frontend Developer Assessment",
      description: "Technical assessment for frontend development skills",
      sections: [
        {
          id: "section-1",
          title: "Technical Skills",
          description: "Evaluate your technical knowledge",
          questions: [
            {
              id: "q1",
              type: "single-choice",
              title: "Which React hook is used for side effects?",
              required: true,
              options: ["useState", "useEffect", "useContext", "useReducer"],
            },
            {
              id: "q2",
              type: "multi-choice",
              title: "Which of the following are CSS preprocessors?",
              required: true,
              options: ["Sass", "Less", "Stylus", "PostCSS"],
            },
            {
              id: "q3",
              type: "long-text",
              title: "Describe your experience with state management in React applications.",
              required: true,
            },
            {
              id: "q4",
              type: "single-choice",
              title: "Do you have experience with TypeScript?",
              required: true,
              options: ["Yes", "No"],
              conditional: null
            },
            {
              id: "q5",
              type: "long-text",
              title: "Describe your TypeScript experience and best practices you follow.",
              required: true,
              conditional: {
                dependsOn: "q4",
                value: "Yes"
              }
            }
          ],
        },
      ],
    },
    "2": {
      jobId: "2",
      title: "Backend Engineer Assessment",
      description: "Technical assessment for backend development skills",
      sections: [
        {
          id: "section-1",
          title: "Backend Technologies",
          description: "Assess your backend knowledge",
          questions: [
            {
              id: "q1",
              type: "single-choice",
              title: "Which HTTP status code indicates a successful request?",
              required: true,
              options: ["200", "201", "400", "500"],
            },
            {
              id: "q2",
              type: "multi-choice",
              title: "Which databases have you worked with?",
              required: true,
              options: ["PostgreSQL", "MySQL", "MongoDB", "Redis"],
            },
          ],
        },
      ],
    },
  };
};

// Fallback to mock data when MSW fails
const fallbackToMockData = async (endpoint, options) => {
  console.log('Using fallback mock data for:', endpoint);

  // Ensure mock data is initialized
  // initializeMockDataOnce();
  initializeMockData();

  const url = new URL(`http://localhost${endpoint}`);

  if (endpoint.startsWith('/api/jobs')) {
    return handleJobsAPI(endpoint, options);
  } else if (endpoint.startsWith('/api/candidates')) {
    return handleCandidatesAPI(endpoint, options);
  } else if (endpoint.startsWith('/api/assessments')) {
    return handleAssessmentsAPI(endpoint, options);
  }

  throw new Error('No fallback handler for this endpoint');
};

// Production-safe API call that uses mock data directly in production
const apiCall = async (endpoint, options = {}) => {
  // In production, always use mock data directly
  // if (import.meta.env.PROD || !import.meta.env.DEV) {
  //   console.log('Production mode: Using mock data directly for:', endpoint);
  //   return fallbackToMockData(endpoint, options);
  // }

  // In development, try MSW first, fallback to mock data if it fails
  console.log('Development mode: Making API call to:', endpoint);
  const res = await fetch(endpoint, {
    headers: { 'Content-Type': 'application/json' },
    ...options,
  });

  if (!res.ok) {
    let message = `Request failed with ${res.status}`;
    try {
      const data = await res.json();
      if (data?.error) message = data.error;
    } catch (parseError) {
      if (parseError.message.includes('Unexpected token') || parseError.message.includes('<!DOCTYPE')) {
        message = 'MSW not working, falling back to mock data';
        return fallbackToMockData(endpoint, options);
      }
    }
    throw new Error(message);
  }

  const text = await res.text();
  return text ? JSON.parse(text) : null;
};

const handleJobsAPI = async (endpoint, options, id, action) => {
  if (options.method === 'GET' && !id) {
    // GET /jobs - list jobs with pagination and filtering
    const url = new URL(`http://localhost${endpoint}`);
    const search = url.searchParams.get('search') || '';
    const status = url.searchParams.get('status') || 'all';
    const page = parseInt(url.searchParams.get('page')) || 1;
    const pageSize = parseInt(url.searchParams.get('pageSize')) || 10;
    const sort = url.searchParams.get('sort') || 'order';

    let filteredJobs = mockJobs.filter(job => {
      const matchesSearch = !search || 
        job.title.toLowerCase().includes(search.toLowerCase()) ||
        job.slug.toLowerCase().includes(search.toLowerCase());
      
      const matchesStatus = status === 'all' || job.status === status;
      
      return matchesSearch && matchesStatus;
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

    return {
      data: paginatedJobs,
      pagination: {
        page,
        pageSize,
        total: filteredJobs.length,
        totalPages: Math.ceil(filteredJobs.length / pageSize)
      }
    };
  } else if (options.method === 'GET' && id) {
    // GET /jobs/:id
    const job = mockJobs.find(j => j.id === id);
    if (!job) throw new Error('Job not found');
    return job;
  } else if (options.method === 'POST') {
    // POST /jobs
    const jobData = JSON.parse(options.body);
    const newJob = {
      id: `job-${Date.now()}`,
      ...jobData,
      order: jobData.order || Date.now()
    };
    mockJobs.push(newJob);
    return newJob;
  } else if (options.method === 'PATCH' && action === 'reorder') {
    // PATCH /jobs/:id/reorder
    const { fromOrder, toOrder } = JSON.parse(options.body);
    const job = mockJobs.find(j => j.id === id);
    if (!job) throw new Error('Job not found');
    job.order = toOrder;
    return { success: true };
  } else if (options.method === 'PATCH') {
    // PATCH /jobs/:id
    const jobData = JSON.parse(options.body);
    const jobIndex = mockJobs.findIndex(job => job.id === id);
    if (jobIndex === -1) throw new Error('Job not found');
    mockJobs[jobIndex] = { ...mockJobs[jobIndex], ...jobData };
    return mockJobs[jobIndex];
  } else if (options.method === 'DELETE') {
    // DELETE /jobs/:id
    const jobIndex = mockJobs.findIndex(job => job.id === id);
    if (jobIndex === -1) throw new Error('Job not found');
    mockJobs.splice(jobIndex, 1);
    return { success: true };
  }
};

const handleCandidatesAPI = async (endpoint, options, id, action) => {
  if (options.method === 'GET' && !id) {
    // GET /candidates - list candidates with pagination and filtering
    const url = new URL(`http://localhost${endpoint}`);
    const search = url.searchParams.get('search') || '';
    const stage = url.searchParams.get('stage') || 'all';
    const page = parseInt(url.searchParams.get('page')) || 1;
    const pageSize = parseInt(url.searchParams.get('pageSize')) || 20;

    let filteredCandidates = mockCandidates.filter(candidate => {
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

    return {
      data: paginatedCandidates,
      pagination: {
        page,
        pageSize,
        total: filteredCandidates.length,
        totalPages: Math.ceil(filteredCandidates.length / pageSize)
      }
    };
  } else if (options.method === 'GET' && id && action === 'timeline') {
    // GET /candidates/:id/timeline
    const candidateTimeline = mockTimeline
      .filter(entry => entry.candidateId === id)
      .sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp));
    return candidateTimeline;
  } else if (options.method === 'GET' && id) {
    // GET /candidates/:id
    const candidate = mockCandidates.find(c => c.id === id);
    if (!candidate) throw new Error('Candidate not found');
    return candidate;
  } else if (options.method === 'POST' && action === 'notes') {
    // POST /candidates/:id/notes
    const { note } = JSON.parse(options.body);
    const timelineEntry = {
      id: `timeline-${Date.now()}`,
      candidateId: id,
      action: "note_added",
      details: `Note added: ${note}`,
      note: note,
      timestamp: new Date().toISOString(),
    };
    mockTimeline.push(timelineEntry);
    return timelineEntry;
  } else if (options.method === 'POST') {
    // POST /candidates
    const candidateData = JSON.parse(options.body);
    const newCandidate = {
      id: `candidate-${Date.now()}`,
      ...candidateData,
      appliedDate: new Date().toISOString()
    };
    mockCandidates.push(newCandidate);
    
    // Add initial timeline entry
    mockTimeline.push({
      id: `timeline-${Date.now()}`,
      candidateId: newCandidate.id,
      action: "application_received",
      details: `Application received`,
      timestamp: new Date().toISOString(),
    });
    return newCandidate;
  } else if (options.method === 'PATCH') {
    // PATCH /candidates/:id
    const candidateData = JSON.parse(options.body);
    const candidateIndex = mockCandidates.findIndex(candidate => candidate.id === id);
    if (candidateIndex === -1) throw new Error('Candidate not found');
    
    const oldStage = mockCandidates[candidateIndex].stage;
    mockCandidates[candidateIndex] = { ...mockCandidates[candidateIndex], ...candidateData };
    
    // Add timeline entry for stage changes
    if (candidateData.stage && candidateData.stage !== oldStage) {
      mockTimeline.push({
        id: `timeline-${Date.now()}`,
        candidateId: id,
        action: "stage_change",
        details: `Stage changed from ${oldStage} to ${candidateData.stage}`,
        fromStage: oldStage,
        toStage: candidateData.stage,
        timestamp: new Date().toISOString(),
      });
    }
    return mockCandidates[candidateIndex];
  }
};

const handleAssessmentsAPI = async (endpoint, options, id, action) => {
  if (options.method === 'GET') {
    // GET /assessments/:jobId
    const assessment = mockAssessments[id];
    if (!assessment) throw new Error('Assessment not found');
    return assessment;
  } else if (options.method === 'PUT') {
    // PUT /assessments/:jobId
    const assessmentData = JSON.parse(options.body);
    mockAssessments[id] = assessmentData;
    return assessmentData;
  } else if (options.method === 'POST' && action === 'submit') {
    // POST /assessments/:jobId/submit
    const submissionData = JSON.parse(options.body);
    console.log('Assessment submission:', submissionData);
    return { success: true, submissionId: `submission-${Date.now()}` };
  }
};

// Jobs API
export const jobsAPI = {
  // GET /jobs?search=&status=&page=&pageSize=&sort=
  getJobs: async (params = {}) => {
    const searchParams = new URLSearchParams();
    Object.entries(params).forEach(([key, value]) => {
      if (value !== undefined && value !== null && value !== '') {
        searchParams.append(key, value);
      }
    });
    
    const queryString = searchParams.toString();
    return apiCall(`${API_BASE_URL}/jobs${queryString ? `?${queryString}` : ''}`);
  },

  // POST /jobs
  createJob: async (jobData) => {
    if (shouldSimulateError()) {
      throw new Error('Internal server error');
    }
    return apiCall(`${API_BASE_URL}/jobs`, {
      method: 'POST',
      body: JSON.stringify(jobData),
    });
  },

  // PATCH /jobs/:id
  updateJob: async (jobId, jobData) => {
    if (shouldSimulateError()) {
      throw new Error('Internal server error');
    }
    return apiCall(`${API_BASE_URL}/jobs/${jobId}`, {
      method: 'PATCH',
      body: JSON.stringify(jobData),
    });
  },

  // PATCH /jobs/:id/reorder
  reorderJob: async (jobId, fromOrder, toOrder) => {
    if (shouldSimulateError()) {
      throw new Error('Reorder failed');
    }
    return apiCall(`${API_BASE_URL}/jobs/${jobId}/reorder`, {
      method: 'PATCH',
      body: JSON.stringify({ fromOrder, toOrder }),
    });
  },

  // GET /jobs/:id
  getJob: async (jobId) => {
    return apiCall(`${API_BASE_URL}/jobs/${jobId}`);
  },

  // DELETE /jobs/:id
  deleteJob: async (jobId) => {
    if (shouldSimulateError()) {
      throw new Error('Internal server error');
    }
    return apiCall(`${API_BASE_URL}/jobs/${jobId}`, {
      method: 'DELETE',
    });
  },
};

// Candidates API
export const candidatesAPI = {
  // GET /candidates?search=&stage=&page=
  getCandidates: async (params = {}) => {
    const searchParams = new URLSearchParams();
    Object.entries(params).forEach(([key, value]) => {
      if (value !== undefined && value !== null && value !== '') {
        searchParams.append(key, value);
      }
    });

    const queryString = searchParams.toString();

    try {
      return await apiCall(`${API_BASE_URL}/candidates${queryString ? `?${queryString}` : ''}`);
    } catch (error) {
      console.warn('API call failed, using fallback data:', error);
      // Fallback to mock data if API fails
      if (!mockCandidates.length) {
        initializeMockData();
      }
      const search = params.search || '';
      const stage = params.stage || 'all';
      const page = parseInt(params.page) || 1;
      const pageSize = parseInt(params.pageSize) || 20;

      let filteredCandidates = mockCandidates.filter(candidate => {
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

      return {
        data: paginatedCandidates,
        pagination: {
          page,
          pageSize,
          total: filteredCandidates.length,
          totalPages: Math.ceil(filteredCandidates.length / pageSize)
        }
      };
    }
  },

  // POST /candidates
  createCandidate: async (candidateData) => {
    if (shouldSimulateError()) {
      throw new Error('Internal server error');
    }
    return apiCall(`${API_BASE_URL}/candidates`, {
      method: 'POST',
      body: JSON.stringify(candidateData),
    });
  },

  // PATCH /candidates/:id
  updateCandidate: async (candidateId, candidateData) => {
    if (shouldSimulateError()) {
      throw new Error('Internal server error');
    }
    return apiCall(`${API_BASE_URL}/candidates/${candidateId}`, {
      method: 'PATCH',
      body: JSON.stringify(candidateData),
    });
  },

  // GET /candidates/:id
  getCandidate: async (candidateId) => {
    try {
      return await apiCall(`${API_BASE_URL}/candidates/${candidateId}`);
    } catch (error) {
      console.warn('API call failed, using fallback data:', error);
      // Fallback to mock data if API fails
      if (!mockCandidates.length) {
        initializeMockData();
      }
      const candidate = mockCandidates.find(c => c.id === candidateId);
      if (!candidate) throw new Error('Candidate not found');
      return candidate;
    }
  },

  // GET /candidates/:id/timeline
  getCandidateTimeline: async (candidateId) => {
    try {
      return await apiCall(`${API_BASE_URL}/candidates/${candidateId}/timeline`);
    } catch (error) {
      console.warn('API call failed, using fallback data:', error);
      // Fallback to mock data if API fails
      if (!mockTimeline.length) {
        initializeMockData();
      }
      const candidateTimeline = mockTimeline
        .filter(entry => entry.candidateId === candidateId)
        .sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp));
      return candidateTimeline;
    }
  },

  // POST /candidates/:id/notes
  addNote: async (candidateId, note) => {
    if (shouldSimulateError()) {
      throw new Error('Internal server error');
    }
    return apiCall(`${API_BASE_URL}/candidates/${candidateId}/notes`, {
      method: 'POST',
      body: JSON.stringify({ note }),
    });
  },
};

// Assessments API
export const assessmentsAPI = {
  // GET /assessments/:jobId
  getAssessment: async (jobId) => {
    return apiCall(`${API_BASE_URL}/assessments/${jobId}`);
  },

  // PUT /assessments/:jobId
  saveAssessment: async (jobId, assessmentData) => {
    if (shouldSimulateError()) {
      throw new Error('Internal server error');
    }
    return apiCall(`${API_BASE_URL}/assessments/${jobId}`, {
      method: 'PUT',
      body: JSON.stringify(assessmentData),
    });
  },

  // POST /assessments/:jobId/submit
  submitAssessment: async (jobId, submissionData) => {
    if (shouldSimulateError()) {
      throw new Error('Internal server error');
    }
    return apiCall(`${API_BASE_URL}/assessments/${jobId}/submit`, {
      method: 'POST',
      body: JSON.stringify(submissionData),
    });
  },
  // GET /assessments/:jobId/submissions
  getSubmissions: async (jobId) => {
    return apiCall(`${API_BASE_URL}/assessments/${jobId}/submissions`);
  },
};

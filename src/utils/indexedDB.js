// IndexedDB utility for TalentFlow
let db = null;

export const initializeDB = async () => {
  return new Promise((resolve, reject) => {
    const request = indexedDB.open("TalentFlowDB", 2);

    request.onerror = () => reject(request.error);
    request.onsuccess = () => {
      db = request.result;
      resolve(db);
    };

    request.onupgradeneeded = (event) => {
      const database = event.target.result;

      // Jobs store
      if (!database.objectStoreNames.contains("jobs")) {
        const jobsStore = database.createObjectStore("jobs", { keyPath: "id" });
        jobsStore.createIndex("status", "status", { unique: false });
        jobsStore.createIndex("order", "order", { unique: false });
      }

      // Candidates store
      if (!database.objectStoreNames.contains("candidates")) {
        const candidatesStore = database.createObjectStore("candidates", {
          keyPath: "id",
        });
        candidatesStore.createIndex("stage", "stage", { unique: false });
        candidatesStore.createIndex("jobId", "jobId", { unique: false });
      }

      // Assessments store
      if (!database.objectStoreNames.contains("assessments")) {
        database.createObjectStore("assessments", { keyPath: "jobId" });
      }

      // Timeline store for candidate status changes
      if (!database.objectStoreNames.contains("timeline")) {
        const timelineStore = database.createObjectStore("timeline", {
          keyPath: "id",
          autoIncrement: true,
        });
        timelineStore.createIndex("candidateId", "candidateId", {
          unique: false,
        });
      }

      // Submissions store (persist assessment submissions)
      if (!database.objectStoreNames.contains("submissions")) {
        const submissionsStore = database.createObjectStore("submissions", {
          keyPath: "id",
        });
        submissionsStore.createIndex("jobId", "jobId", { unique: false });
        submissionsStore.createIndex("candidateId", "candidateId", { unique: false });
        submissionsStore.createIndex("submittedAt", "submittedAt", { unique: false });
      }
    };
  });
};

export const getStore = (storeName, mode = "readonly") => {
  if (!db) throw new Error("Database not initialized");
  return db.transaction([storeName], mode).objectStore(storeName);
};

// Jobs operations
export const saveJob = async (job) => {
  const store = getStore("jobs", "readwrite");
  return store.put(job);
};

export const getJobs = async () => {
  const store = getStore("jobs");
  return new Promise((resolve, reject) => {
    const request = store.getAll();
    request.onsuccess = () => resolve(request.result);
    request.onerror = () => reject(request.error);
  });
};

export const getJob = async (id) => {
  const store = getStore("jobs");
  return new Promise((resolve, reject) => {
    const request = store.get(id);
    request.onsuccess = () => resolve(request.result);
    request.onerror = () => reject(request.error);
  });
};

export const deleteJob = async (id) => {
  const store = getStore("jobs", "readwrite");
  return store.delete(id);
};

// Candidates operations
export const saveCandidate = async (candidate) => {
  const store = getStore("candidates", "readwrite");
  return store.put(candidate);
};

export const getCandidates = async () => {
  const store = getStore("candidates");
  return new Promise((resolve, reject) => {
    const request = store.getAll();
    request.onsuccess = () => resolve(request.result);
    request.onerror = () => reject(request.error);
  });
};

export const getCandidate = async (id) => {
  const store = getStore("candidates");
  return new Promise((resolve, reject) => {
    const request = store.get(id);
    request.onsuccess = () => resolve(request.result);
    request.onerror = () => reject(request.error);
  });
};

// Assessments operations
export const saveAssessment = async (assessment) => {
  const store = getStore("assessments", "readwrite");
  return store.put(assessment);
};

export const getAssessment = async (jobId) => {
  const store = getStore("assessments");
  return new Promise((resolve, reject) => {
    const request = store.get(jobId);
    request.onsuccess = () => resolve(request.result);
    request.onerror = () => reject(request.error);
  });
};

// Timeline operations
export const addTimelineEntry = async (entry) => {
  const store = getStore("timeline", "readwrite");
  return store.add({
    ...entry,
    timestamp: new Date().toISOString(),
  });
};

export const getCandidateTimeline = async (candidateId) => {
  const store = getStore("timeline");
  const index = store.index("candidateId");
  return new Promise((resolve, reject) => {
    const request = index.getAll(candidateId);
    request.onsuccess = () => resolve(request.result);
    request.onerror = () => reject(request.error);
  });
};

// Submissions operations
export const saveSubmission = async (submission) => {
  const store = getStore("submissions", "readwrite");
  return new Promise((resolve, reject) => {
    const payload = {
      id: submission.id || `submission-${Date.now()}`,
      jobId: submission.jobId,
      candidateId: submission.candidateId,
      responses: submission.responses,
      submittedAt: submission.submittedAt || new Date().toISOString(),
    };
    const req = store.put(payload);
    req.onsuccess = () => resolve(payload);
    req.onerror = () => reject(req.error);
  });
};

export const getSubmissionsByJob = async (jobId) => {
  const store = getStore("submissions");
  const index = store.index("jobId");
  return new Promise((resolve, reject) => {
    const req = index.getAll(jobId);
    req.onsuccess = () => resolve(req.result || []);
    req.onerror = () => reject(req.error);
  });
};

export const getSubmissionsByCandidate = async (candidateId) => {
  const store = getStore("submissions");
  const index = store.index("candidateId");
  return new Promise((resolve, reject) => {
    const req = index.getAll(candidateId);
    req.onsuccess = () => resolve(req.result || []);
    req.onerror = () => reject(req.error);
  });
};

// Seed data function
export const seedData = async () => {
  // Ensure DB is initialized before any store access
  if (!db) {
    await initializeDB();
  }
  const jobs = await getJobs();

  // Seed 25 jobs (mixed active/archived)
  const baseJobs = [
    { title: 'Senior Frontend Developer', tags: ['React', 'TypeScript', 'CSS'] },
    { title: 'Backend Engineer', tags: ['Node.js', 'Python', 'Database'] },
    { title: 'Product Manager', tags: ['Strategy', 'Analytics', 'Leadership'] },
    { title: 'UX Designer', tags: ['Design', 'Figma', 'User Research'] },
    { title: 'DevOps Engineer', tags: ['AWS', 'Docker', 'Kubernetes'] },
  ];
  const sampleJobs = [];
  for (let i = 1; i <= 25; i++) {
    const template = baseJobs[(i - 1) % baseJobs.length];
    const id = String(i);
    const title = `${template.title} ${i}`;
    const slug = `${template.title.toLowerCase().replace(/[^a-z0-9]+/g, '-')}-${i}`.replace(/-+$/,'');
    const status = i % 5 === 0 ? 'archived' : 'active';
    const description = `Auto-seeded: ${template.title} role (#${i}).`;
    sampleJobs.push({ id, title, slug, status, tags: template.tags, order: i, description });
  }
  // Seed base jobs only if DB empty
  if (jobs.length === 0) {
    for (const job of sampleJobs) await saveJob(job);
  }

  // Seed candidates
  const stages = ["applied", "screen", "tech", "offer", "hired", "rejected"];
  const firstNames = [
    "John",
    "Jane",
    "Michael",
    "Sarah",
    "David",
    "Emily",
    "Chris",
    "Lisa",
    "Robert",
    "Anna",
    "James",
    "Maria",
    "William",
    "Jennifer",
    "Richard",
    "Patricia",
    "Charles",
    "Linda",
    "Joseph",
    "Barbara",
  ];
  const lastNames = [
    "Smith",
    "Johnson",
    "Williams",
    "Brown",
    "Jones",
    "Garcia",
    "Miller",
    "Davis",
    "Rodriguez",
    "Martinez",
    "Hernandez",
    "Lopez",
    "Gonzalez",
    "Wilson",
    "Anderson",
    "Thomas",
    "Taylor",
    "Moore",
    "Jackson",
    "Martin",
  ];

  // Ensure we have at least 1000 candidates (top up if needed)
  const existingCandidates = await getCandidates();
  const targetCount = 1000; // minimum required
  const toAdd = Math.max(0, targetCount - existingCandidates.length);

  if (toAdd > 0) {
    // Determine a safe numeric index to continue candidate IDs if present
    const maxIndex = existingCandidates
      .map(c => {
        const m = String(c.id || '').match(/candidate-(\d+)/);
        return m ? parseInt(m[1], 10) : 0;
      })
      .reduce((a, b) => Math.max(a, b), 0);

    const sampleJobsCurrent = jobs.length === 0 ? sampleJobs : jobs;
    const start = maxIndex + 1;
    const end = start + toAdd - 1;

    for (let i = start; i <= end; i++) {
      const firstName = firstNames[Math.floor(Math.random() * firstNames.length)];
      const lastName = lastNames[Math.floor(Math.random() * lastNames.length)];
      const name = `${firstName} ${lastName}`;
      const email = `${firstName.toLowerCase()}.${lastName.toLowerCase()}${i}@example.com`;
      const jobRef = sampleJobsCurrent[Math.floor(Math.random() * sampleJobsCurrent.length)].id;

      const candidate = {
        id: `candidate-${i}`,
        name,
        email,
        stage: stages[Math.floor(Math.random() * stages.length)],
        jobId: jobRef,
        appliedDate: new Date(
          Date.now() - Math.random() * 90 * 24 * 60 * 60 * 1000,
        ).toISOString(),
      };
      await saveCandidate(candidate);
      await addTimelineEntry({
        candidateId: candidate.id,
        action: "application_received",
        details: `Application received for ${sampleJobsCurrent.find((j) => j.id === candidate.jobId)?.title || "Unknown Position"}`,
      });
    }
  }

  // Seed sample assessments
  const mkChoiceOptions = (n) => Array.from({ length: n }, (_, i) => `Option ${i + 1}`);
  const frontEndAssessment = {
    jobId: '1',
    title: 'Senior Frontend Developer Assessment',
    description: 'Technical assessment for frontend development skills',
    sections: [
      {
        id: 'section-1',
        title: 'Technical Skills',
        description: 'Evaluate your technical knowledge',
        questions: [
          { id: 'q1', type: 'single-choice', title: 'Which React hook is used for side effects?', required: true, options: ['useState','useEffect','useContext','useReducer'] },
          { id: 'q2', type: 'multi-choice', title: 'Which are CSS preprocessors?', required: true, options: ['Sass','Less','Stylus','PostCSS'] },
          { id: 'q3', type: 'short-text', title: 'Favorite state management library?', required: false },
          { id: 'q4', type: 'numeric', title: 'Years of React experience?', required: true, validation: { min: 0, max: 25 } },
          { id: 'q5', type: 'single-choice', title: 'Do you use TypeScript?', required: true, options: ['Yes','No'] },
          { id: 'q6', type: 'long-text', title: 'Describe TS best practices you follow.', required: true, conditional: { dependsOn: 'q5', value: 'Yes' } },
          { id: 'q7', type: 'multi-choice', title: 'Pick CSS-in-JS libs you used', required: false, options: mkChoiceOptions(5) },
          { id: 'q8', type: 'short-text', title: 'What is hydration?', required: false },
          { id: 'q9', type: 'file-upload', title: 'Upload a small sample (stub)', required: false },
          { id: 'q10', type: 'long-text', title: 'Explain React reconciliation.', required: true },
        ],
      },
    ],
  };

  const backEndAssessment = {
    jobId: '2',
    title: 'Backend Engineer Assessment',
    description: 'Technical assessment for backend development skills',
    sections: [
      {
        id: 'section-1',
        title: 'Backend Technologies',
        description: 'Assess your backend knowledge',
        questions: [
          { id: 'bq1', type: 'single-choice', title: '200 OK is which class?', required: true, options: ['1xx','2xx','4xx','5xx'] },
          { id: 'bq2', type: 'multi-choice', title: 'Databases you used', required: true, options: ['PostgreSQL','MySQL','MongoDB','Redis'] },
          { id: 'bq3', type: 'short-text', title: 'Preferred ORM?', required: false },
          { id: 'bq4', type: 'numeric', title: 'Years Node.js experience?', required: true, validation: { min: 0, max: 25 } },
          { id: 'bq5', type: 'single-choice', title: 'Use message queues?', required: true, options: ['Yes','No'] },
          { id: 'bq6', type: 'long-text', title: 'Explain eventual consistency.', required: true },
          { id: 'bq7', type: 'multi-choice', title: 'Pick caching layers used', required: false, options: mkChoiceOptions(6) },
          { id: 'bq8', type: 'short-text', title: 'What is idempotency?', required: true },
          { id: 'bq9', type: 'file-upload', title: 'Upload API schema (stub)', required: false },
          { id: 'bq10', type: 'long-text', title: 'Describe zero-downtime deploy strategy.', required: true },
        ],
      },
    ],
  };

  const pmAssessment = {
    jobId: '3',
    title: 'Product Manager Assessment',
    description: 'Assessment for PM skills and experience',
    sections: [
      {
        id: 'section-1',
        title: 'Product Thinking',
        description: 'Evaluate product sense',
        questions: [
          { id: 'p1', type: 'long-text', title: 'Define a success metric for a new feature.', required: true },
          { id: 'p2', type: 'single-choice', title: 'Choose a prioritization framework', required: true, options: ['RICE','MoSCoW','Kano','ICE'] },
          { id: 'p3', type: 'short-text', title: 'One risk mitigation strategy?', required: true },
          { id: 'p4', type: 'multi-choice', title: 'Pick market research methods used', required: false, options: mkChoiceOptions(6) },
          { id: 'p5', type: 'numeric', title: 'Years in product roles', required: true, validation: { min: 0, max: 40 } },
          { id: 'p6', type: 'single-choice', title: 'Have you run A/B tests?', required: true, options: ['Yes','No'] },
          { id: 'p7', type: 'long-text', title: 'Describe a difficult trade-off.', required: true },
          { id: 'p8', type: 'short-text', title: 'Favorite analytics tool?', required: false },
          { id: 'p9', type: 'file-upload', title: 'Attach a PRD sample (stub)', required: false },
          { id: 'p10', type: 'long-text', title: 'Outline a 90-day plan.', required: true },
        ],
      },
    ],
  };

  // Only seed sample assessments if DB empty (avoid duplicates)
  if (jobs.length === 0) {
    for (const assessment of [frontEndAssessment, backEndAssessment, pmAssessment]) {
      await saveAssessment(assessment);
    }
  }

  console.log("Sample data seeded successfully (ensured candidates >= 1000)");
};

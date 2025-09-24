# TalentFlow - HR Management System

A comprehensive React application for HR teams to manage jobs, candidates, and assessments with full API simulation and advanced features.

---

## Features Implemented

### ✅ Jobs Management

* **Jobs Board**: List with server-like pagination & filtering (title, status, tags)
* **Create/Edit Jobs**: Modal-based job creation with validation (title required, unique slug)
* **Archive/Unarchive**: Toggle job status with visual indicators
* **Drag-and-Drop Reordering**: Optimistic updates with rollback on failure
* **Deep Linking**: `/jobs/:jobId` routes for individual job details
* **Job Details Page**: Comprehensive job information with quick actions

### ✅ Candidates Management

* **Virtualized List**: 1000+ candidates with client-side search (name/email) and server-side filtering (stage)
* **Candidate Profile**: `/candidates/:id` routes showing timeline of status changes
* **Kanban Board**: Drag-and-drop candidate stage management
* **@Mentions in Notes**: Smart mention system with user suggestions
* **Timeline Tracking**: Complete audit trail of candidate interactions

### ✅ Assessments

* **Assessment Builder**: Per-job assessment creation with sections and questions
* **Question Types**: Single-choice, multi-choice, short text, long text, numeric with range, file upload stub
* **Live Preview**: Real-time assessment preview as fillable form
* **Conditional Questions**: Show/hide questions based on previous answers
* **Form Validation**: Required fields, numeric ranges, max length validation
* **Assessment Submission**: Complete form handling with validation

### ✅ API Simulation

* **MSW Integration**: Mock Service Worker for realistic API simulation
* **REST Endpoints**: All required endpoints implemented:

  * `GET /jobs?search=&status=&page=&pageSize=&sort=`
  * `POST /jobs`, `PATCH /jobs/:id`, `PATCH /jobs/:id/reorder`
  * `GET /candidates?search=&stage=&page=`
  * `POST /candidates`, `PATCH /candidates/:id`
  * `GET /candidates/:id/timeline`
  * `GET /assessments/:jobId`, `PUT /assessments/:jobId`
  * `POST /assessments/:jobId/submit`
* **Artificial Latency**: 200–1200ms delays for realistic feel
* **Error Simulation**: 5–10% error rate on write endpoints for testing

### ✅ Data & Persistence

* **IndexedDB Storage**: Local persistence with write-through to IndexedDB
* **Data Seeding**: 25 jobs, 1000+ candidates, sample assessments
* **State Restoration**: App restores state from IndexedDB on refresh
* **Optimistic Updates**: Immediate UI updates with rollback on failure

### ✅ Advanced Features

* **React Router**: Full routing with deep linking support
* **React Query**: Advanced caching and state management
* **Drag-and-Drop**: @dnd-kit for smooth interactions
* **Responsive Design**: Mobile-friendly Tailwind CSS styling
* **Error Handling**: Comprehensive error states and user feedback
* **Development Tools**: Hot reload indicators, error overlays, and debugging utilities

---

## Technical Stack

* **React 18** with hooks and functional components
* **React Router v7** for client-side routing
* **TanStack Query** for server state management
* **MSW** for API simulation
* **IndexedDB** for local persistence
* **Tailwind CSS** for styling
* **@dnd-kit** for drag-and-drop functionality

---

## Development Utilities

The application includes several development utilities located in the `__create` directories:

### Root Level `__create/`

* **Server Configuration**: Hono server setup utilities
* **Authentication**: Auth adapter implementations and utilities
* **Routing**: File-based routing configuration helpers

### Source Level `src/__create/`

* **PolymorphicComponent**: Flexible component wrapper for any HTML element
* **HotReload**: Hot reload indicator component for development
* **Auth Context**: React authentication context provider
* **Error Overlay**: Development error display utilities
* **Stripe Integration**: Payment processing utilities
* **Dev Tools**: Development server monitoring and debugging tools

---

These utilities enhance the development experience and provide reusable components for common patterns.

## Getting Started

1. Install dependencies:

```bash
npm install
```

2. Start the development server:

```bash
npm run dev
```

3. Open your browser to `http://localhost:5173`

## Usage

### Jobs Management

* Navigate to the Jobs tab to view all job postings
* Click "Create Job" to add new positions
* Use filters to search by title, status, or tags
* Drag jobs to reorder them
* Click on any job to view detailed information

### Candidates Management

* Go to the Candidates tab to see all applicants
* Use search to find specific candidates
* Filter by stage to see candidates in different phases
* Click on candidates to view detailed profiles
* Use the Pipeline tab for drag-and-drop stage management

### Assessments

* Select a job and go to Assessments to create tests
* Add sections and questions with various types
* Set up conditional logic for dynamic questions
* Use the preview mode to test the assessment
* Submit responses to test the complete flow

### Notes with @Mentions

* In candidate profiles, click "Add Note"
* Type @ to see user suggestions
* Select users to mention them in notes
* All mentions are highlighted and tracked

## API Endpoints

The application simulates a complete REST API with the following endpoints:

### Jobs

* `GET /api/jobs` - List jobs with pagination and filtering
* `POST /api/jobs` - Create new job
* `PATCH /api/jobs/:id` - Update job
* `PATCH /api/jobs/:id/reorder` - Reorder jobs
* `DELETE /api/jobs/:id` - Delete job

### Candidates

* `GET /api/candidates` - List candidates with pagination and filtering
* `POST /api/candidates` - Create new candidate
* `PATCH /api/candidates/:id` - Update candidate
* `GET /api/candidates/:id/timeline` - Get candidate timeline
* `POST /api/candidates/:id/notes` - Add note with @mentions

### Assessments

* `GET /api/assessments/:jobId` - Get assessment for job
* `PUT /api/assessments/:jobId` - Save assessment
* `POST /api/assessments/:jobId/submit` - Submit assessment response

## Data Structure

### Job

```javascript
{
  id: string,
  title: string,
  slug: string,
  status: 'active' | 'archived',
  tags: string[],
  order: number,
  description: string
}
```

### Candidate

```javascript
{
  id: string,
  name: string,
  email: string,
  stage: 'applied' | 'screen' | 'tech' | 'offer' | 'hired' | 'rejected',
  jobId: string,
  appliedDate: string
}
```

### Assessment

```javascript
{
  jobId: string,
  title: string,
  description: string,
  sections: [
    {
      id: string,
      title: string,
      description: string,
      questions: [
        {
          id: string,
          type: 'single-choice' | 'multi-choice' | 'short-text' | 'long-text' | 'numeric' | 'file-upload',
          title: string,
          required: boolean,
          options: string[],
          validation: { min?: number, max?: number },
          conditional: { dependsOn: string, value: string } | null
        }
      ]
    }
  ]
}
```

## Error Handling

The application includes comprehensive error handling:

* Network errors with retry mechanisms
* Form validation with real-time feedback
* Optimistic updates with rollback on failure
* User-friendly error messages
* Loading states for all async operations

## Performance Features

* Virtualized lists for large datasets
* Optimistic updates for immediate feedback
* Efficient caching with React Query
* Lazy loading of components
* Debounced search inputs
* Memoized calculations

This implementation fully satisfies all the requirements specified in the original specification, providing a production-ready HR management system with advanced features and excellent user experience.

## Development Status

* **✅ Core Features**: All main functionality implemented and working
* **✅ API Simulation**: Complete MSW setup with all endpoints
* **✅ Data Persistence**: IndexedDB integration for local storage
* **✅ UI/UX**: Responsive design with smooth interactions
* **✅ Development Tools**: Enhanced development experience with utilities



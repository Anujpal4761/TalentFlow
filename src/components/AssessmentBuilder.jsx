import React, { useState, useEffect } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useParams, useNavigate } from 'react-router-dom';
import { assessmentsAPI, jobsAPI } from '../utils/api';

export default function AssessmentBuilder({ jobId: propJobId }) {
  const { jobId: paramJobId } = useParams();
  const jobId = propJobId || paramJobId;
  const navigate = useNavigate();
  
  const [assessment, setAssessment] = useState({
    jobId: jobId,
    title: '',
    description: '',
    sections: []
  });
  const [previewMode, setPreviewMode] = useState(false);
  const [activeSection, setActiveSection] = useState(0);
  const [responses, setResponses] = useState({});
  const [selectedJobId, setSelectedJobId] = useState('');

  const queryClient = useQueryClient();

  // Fetch job details
  const { data: job } = useQuery({
    queryKey: ['job', jobId],
    queryFn: () => jobsAPI.getJob(jobId),
    enabled: !!jobId
  });

  // Fetch jobs list when no jobId provided, for selection
  const { data: jobsForSelection } = useQuery({
    queryKey: ['jobs', 'for-assessment-selection'],
    queryFn: () => jobsAPI.getJobs({ status: 'active', page: 1, pageSize: 1000, sort: 'title' }),
    enabled: !jobId,
    staleTime: 1000 * 60 * 5,
  });

  // Fetch existing assessment
  const { data: existingAssessment, isLoading } = useQuery({
    queryKey: ['assessment', jobId],
    queryFn: () => assessmentsAPI.getAssessment(jobId),
    enabled: !!jobId
  });

  useEffect(() => {
    if (existingAssessment) {
      setAssessment(existingAssessment);
    } else if (job) {
      setAssessment({
        jobId: jobId,
        title: `${job.title} Assessment`,
        description: `Assessment for ${job.title} position`,
        sections: []
      });
    }
  }, [existingAssessment, job, jobId]);

  // Save assessment mutation
  const saveAssessmentMutation = useMutation({
    mutationFn: (assessmentData) => assessmentsAPI.saveAssessment(jobId, assessmentData),
    onSuccess: () => {
      queryClient.invalidateQueries(['assessment', jobId]);
      alert('Assessment saved successfully!');
    },
    onError: (error) => {
      console.error('Error saving assessment:', error);
      alert('Failed to save assessment. Please try again.');
    }
  });

  // Submit assessment mutation
  const submitAssessmentMutation = useMutation({
    mutationFn: (submissionData) => assessmentsAPI.submitAssessment(jobId, submissionData),
    onSuccess: () => {
      alert('Assessment submitted successfully!');
      setResponses({});
    },
    onError: (error) => {
      console.error('Error submitting assessment:', error);
      alert('Failed to submit assessment. Please try again.');
    }
  });

  const questionTypes = [
    { value: 'single-choice', label: 'Single Choice', icon: '⚪' },
    { value: 'multi-choice', label: 'Multiple Choice', icon: '☑️' },
    { value: 'short-text', label: 'Short Text', icon: '📝' },
    { value: 'long-text', label: 'Long Text', icon: '📄' },
    { value: 'numeric', label: 'Numeric', icon: '🔢' },
    { value: 'file-upload', label: 'File Upload', icon: '📎' }
  ];

  const addSection = () => {
    const newSection = {
      id: `section-${Date.now()}`,
      title: 'New Section',
      description: '',
      questions: []
    };
    setAssessment(prev => ({
      ...prev,
      sections: [...prev.sections, newSection]
    }));
    setActiveSection(assessment.sections.length);
  };

  const updateSection = (sectionIndex, updates) => {
    setAssessment(prev => ({
      ...prev,
      sections: prev.sections.map((section, index) =>
        index === sectionIndex ? { ...section, ...updates } : section
      )
    }));
  };

  const deleteSection = (sectionIndex) => {
    if (window.confirm('Are you sure you want to delete this section?')) {
      setAssessment(prev => ({
        ...prev,
        sections: prev.sections.filter((_, index) => index !== sectionIndex)
      }));
      setActiveSection(Math.max(0, sectionIndex - 1));
    }
  };

  const addQuestion = (sectionIndex) => {
    const newQuestion = {
      id: `question-${Date.now()}`,
      type: 'short-text',
      title: 'New Question',
      description: '',
      required: false,
      options: [],
      validation: {},
      conditional: null
    };

    updateSection(sectionIndex, {
      questions: [...assessment.sections[sectionIndex].questions, newQuestion]
    });
  };

  // Check if a question should be shown based on conditional logic
  const shouldShowQuestion = (question, allQuestions) => {
    if (!question.conditional) return true;
    
    const { dependsOn, value } = question.conditional;
    const dependentQuestion = allQuestions.find(q => q.id === dependsOn);
    
    if (!dependentQuestion) return true;
    
    const response = responses[dependsOn];
    if (!response) return false;
    
    // Handle different question types
    if (dependentQuestion.type === 'single-choice') {
      return response === value;
    } else if (dependentQuestion.type === 'multi-choice') {
      return Array.isArray(response) && response.includes(value);
    }
    
    return false;
  };

  const updateQuestion = (sectionIndex, questionIndex, updates) => {
    const section = assessment.sections[sectionIndex];
    const updatedQuestions = section.questions.map((question, index) =>
      index === questionIndex ? { ...question, ...updates } : question
    );
    updateSection(sectionIndex, { questions: updatedQuestions });
  };

  const deleteQuestion = (sectionIndex, questionIndex) => {
    if (window.confirm('Are you sure you want to delete this question?')) {
      const section = assessment.sections[sectionIndex];
      const updatedQuestions = section.questions.filter((_, index) => index !== questionIndex);
      updateSection(sectionIndex, { questions: updatedQuestions });
    }
  };

  const handleSave = () => {
    if (!assessment.title.trim()) {
      alert('Please enter an assessment title');
      return;
    }
    saveAssessmentMutation.mutate(assessment);
  };

  if (!jobId) {
    const jobs = jobsForSelection?.data || [];
    return (
      <div className="max-w-xl mx-auto bg-gray-800 rounded-lg shadow-sm border border-gray-700 p-6 space-y-4">
        <div className="text-lg font-semibold text-gray-100">Select a job</div>
        <div className="text-gray-400 text-sm">Choose a job to create or edit its assessment.</div>
        <div>
          <label className="block text-sm font-medium text-gray-300 mb-1">Job</label>
          <select
            value={selectedJobId}
            onChange={(e) => setSelectedJobId(e.target.value)}
            className="w-full px-3 py-2 border border-gray-700 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 bg-gray-900 text-gray-100"
          >
            <option value="">Select a job...</option>
            {jobs.map(j => (
              <option key={j.id} value={j.id}>{j.title}</option>
            ))}
          </select>
        </div>
        <div className="flex justify-end">
          <button
            onClick={() => selectedJobId && navigate(`/assessments/${selectedJobId}`)}
            disabled={!selectedJobId}
            className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 disabled:opacity-50"
          >
            Continue
          </button>
        </div>
      </div>
    );
  }

  if (isLoading) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="text-lg text-gray-600">Loading assessment...</div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-2xl font-bold text-gray-100">Assessment Builder</h2>
          {job && (
            <p className="text-gray-400">For: {job.title}</p>
          )}
        </div>
        <div className="flex space-x-3">
          <button
            onClick={() => setPreviewMode(!previewMode)}
            className="px-4 py-2 border border-gray-700 rounded-lg hover:bg-gray-700/60 text-gray-100"
          >
            {previewMode ? '✏️ Edit' : '👁️ Preview'}
          </button>
          <button
            onClick={handleSave}
            disabled={saveAssessmentMutation.isLoading}
            className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 disabled:opacity-50"
          >
            {saveAssessmentMutation.isLoading ? 'Saving...' : 'Save Assessment'}
          </button>
        </div>
      </div>

      {previewMode ? (
        <AssessmentPreview 
          assessment={assessment} 
          onSubmit={(responses) => submitAssessmentMutation.mutate({
            candidateId: 'current-user', // In a real app, this would be the actual candidate ID
            responses
          })}
        />
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
          {/* Sidebar */}
          <div className="lg:col-span-1">
            <div className="bg-gray-800 rounded-lg shadow-sm border border-gray-700 p-4 space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-1">
                  Assessment Title
                </label>
                <input
                  type="text"
                  value={assessment.title}
                  onChange={(e) => setAssessment(prev => ({ ...prev, title: e.target.value }))}
                  className="w-full px-3 py-2 border border-gray-700 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 bg-gray-900 text-gray-100"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-300 mb-1">
                  Description
                </label>
                <textarea
                  value={assessment.description}
                  onChange={(e) => setAssessment(prev => ({ ...prev, description: e.target.value }))}
                  rows={3}
                  className="w-full px-3 py-2 border border-gray-700 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 bg-gray-900 text-gray-100"
                />
              </div>

              <div>
                <div className="flex justify-between items-center mb-2">
                  <h3 className="text-sm font-medium text-gray-300">Sections</h3>
                  <button
                    onClick={addSection}
                    className="text-blue-400 hover:text-blue-300 text-sm"
                  >
                    + Add
                  </button>
                </div>
                <div className="space-y-1">
                  {assessment.sections.map((section, index) => (
                    <button
                      key={section.id}
                      onClick={() => setActiveSection(index)}
                      className={`w-full text-left px-3 py-2 rounded text-sm ${
                        activeSection === index
                          ? 'bg-blue-900/40 text-blue-200'
                          : 'text-gray-300 hover:bg-gray-700/60'
                      }`}
                    >
                      {section.title}
                    </button>
                  ))}
                </div>
              </div>
            </div>
          </div>

          {/* Main Content */}
          <div className="lg:col-span-3">
            {assessment.sections.length === 0 ? (
              <div className="bg-gray-800 rounded-lg shadow-sm border border-gray-700 p-8 text-center">
                <div className="text-gray-300 text-lg mb-2">No sections yet</div>
                <div className="text-gray-400 text-sm mb-4">
                  Add a section to start building your assessment
                </div>
                <button
                  onClick={addSection}
                  className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700"
                >
                  Add First Section
                </button>
              </div>
            ) : (
              <SectionEditor
                section={assessment.sections[activeSection]}
                sectionIndex={activeSection}
                onUpdate={updateSection}
                onDelete={deleteSection}
                onAddQuestion={addQuestion}
                onUpdateQuestion={updateQuestion}
                onDeleteQuestion={deleteQuestion}
                questionTypes={questionTypes}
                allQuestions={assessment.sections.flatMap(s => s.questions)}
              />
            )}
          </div>
        </div>
      )}
    </div>
  );
}

// Section Editor Component
function SectionEditor({
  section,
  sectionIndex,
  onUpdate,
  onDelete,
  onAddQuestion,
  onUpdateQuestion,
  onDeleteQuestion,
  questionTypes,
  allQuestions
}) {
  return (
    <div className="bg-gray-800 rounded-lg shadow-sm border border-gray-700 p-6 space-y-6">
      {/* Section Header */}
      <div className="flex justify-between items-start">
        <div className="flex-1 space-y-4">
          <input
            type="text"
            value={section.title}
            onChange={(e) => onUpdate(sectionIndex, { title: e.target.value })}
            className="text-xl font-semibold w-full border-0 border-b-2 border-gray-600 focus:border-blue-500 focus:outline-none bg-transparent text-gray-100"
            placeholder="Section Title"
          />
          <textarea
            value={section.description}
            onChange={(e) => onUpdate(sectionIndex, { description: e.target.value })}
            placeholder="Section description..."
            rows={2}
            className="w-full px-3 py-2 border border-gray-700 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 bg-gray-900 text-gray-100"
          />
        </div>
        <button
          onClick={() => onDelete(sectionIndex)}
          className="text-red-400 hover:text-red-300 ml-4"
          title="Delete section"
        >
          🗑️
        </button>
      </div>

      {/* Questions */}
      <div className="space-y-4">
        <div className="flex justify-between items-center">
          <h4 className="text-lg font-medium text-gray-100">Questions</h4>
          <button
            onClick={() => onAddQuestion(sectionIndex)}
            className="bg-green-600 text-white px-3 py-1 rounded text-sm hover:bg-green-700"
          >
            + Add Question
          </button>
        </div>

        {section.questions.map((question, questionIndex) => (
          <QuestionEditor
            key={question.id}
            question={question}
            questionIndex={questionIndex}
            sectionIndex={sectionIndex}
            onUpdate={onUpdateQuestion}
            onDelete={onDeleteQuestion}
            questionTypes={questionTypes}
            allQuestions={allQuestions}
          />
        ))}

        {section.questions.length === 0 && (
          <div className="text-center py-8 text-gray-500">
            No questions yet. Add your first question above.
          </div>
        )}
      </div>
    </div>
  );
}

// Question Editor Component
function QuestionEditor({
  question,
  questionIndex,
  sectionIndex,
  onUpdate,
  onDelete,
  questionTypes,
  allQuestions
}) {
  const questionType = questionTypes.find(t => t.value === question.type);

  const addOption = () => {
    const newOptions = [...(question.options || []), ''];
    onUpdate(sectionIndex, questionIndex, { options: newOptions });
  };

  const updateOption = (optionIndex, value) => {
    const newOptions = question.options.map((option, index) =>
      index === optionIndex ? value : option
    );
    onUpdate(sectionIndex, questionIndex, { options: newOptions });
  };

  const removeOption = (optionIndex) => {
    const newOptions = question.options.filter((_, index) => index !== optionIndex);
    onUpdate(sectionIndex, questionIndex, { options: newOptions });
  };

  return (
    <div className="border border-gray-700 rounded-lg p-4 space-y-4 bg-gray-800">
      <div className="flex justify-between items-start">
        <div className="flex-1 space-y-3">
          <input
            type="text"
            value={question.title}
            onChange={(e) => onUpdate(sectionIndex, questionIndex, { title: e.target.value })}
            className="w-full font-medium border-0 border-b border-gray-600 focus:border-blue-500 focus:outline-none bg-transparent text-gray-100"
            placeholder="Question title"
          />
          <textarea
            value={question.description}
            onChange={(e) => onUpdate(sectionIndex, questionIndex, { description: e.target.value })}
            placeholder="Write the full question here..."
            rows={3}
            className="w-full px-3 py-2 border border-gray-700 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 bg-gray-900 text-gray-100 placeholder-gray-500"
          />
          
          <div className="grid grid-cols-2 gap-4">
            <select
              value={question.type}
              onChange={(e) => onUpdate(sectionIndex, questionIndex, { type: e.target.value })}
              className="px-3 py-2 border border-gray-700 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 bg-gray-900 text-gray-100"
            >
              {questionTypes.map(type => (
                <option key={type.value} value={type.value}>
                  {type.icon} {type.label}
                </option>
              ))}
            </select>
            
            <label className="flex items-center text-gray-300">
              <input
                type="checkbox"
                checked={question.required}
                onChange={(e) => onUpdate(sectionIndex, questionIndex, { required: e.target.checked })}
                className="mr-2"
              />
              Required
            </label>
          </div>
        </div>
        
        <button
          onClick={() => onDelete(sectionIndex, questionIndex)}
          className="text-red-400 hover:text-red-300 ml-4"
          title="Delete question"
        >
          🗑️
        </button>
      </div>

      {/* Question-specific options */}
      {(question.type === 'single-choice' || question.type === 'multi-choice') && (
        <div className="space-y-2">
          <div className="flex justify-between items-center">
            <label className="text-sm font-medium text-gray-300">Options</label>
            <button
              onClick={addOption}
              className="text-blue-400 hover:text-blue-300 text-sm"
            >
              + Add Option
            </button>
          </div>
          {(question.options || []).map((option, optionIndex) => (
            <div key={optionIndex} className="flex items-center space-x-2">
              <input
                type="text"
                value={option}
                onChange={(e) => updateOption(optionIndex, e.target.value)}
                placeholder={`Option ${optionIndex + 1}`}
                className="flex-1 px-3 py-2 border border-gray-700 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 bg-gray-900 text-gray-100 placeholder-gray-500"
              />
              <button
                onClick={() => removeOption(optionIndex)}
                className="text-red-400 hover:text-red-300"
              >
                ×
              </button>
            </div>
          ))}
        </div>
      )}

      {question.type === 'numeric' && (
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-300 mb-1">Min Value</label>
            <input
              type="number"
              value={question.validation?.min || ''}
              onChange={(e) => onUpdate(sectionIndex, questionIndex, {
                validation: { ...question.validation, min: e.target.value }
              })}
              className="w-full px-3 py-2 border border-gray-700 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 bg-gray-900 text-gray-100"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-300 mb-1">Max Value</label>
            <input
              type="number"
              value={question.validation?.max || ''}
              onChange={(e) => onUpdate(sectionIndex, questionIndex, {
                validation: { ...question.validation, max: e.target.value }
              })}
              className="w-full px-3 py-2 border border-gray-700 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 bg-gray-900 text-gray-100"
            />
          </div>
        </div>
      )}

      {/* Conditional Question Settings */}
      <div className="border-t border-gray-700 pt-4">
        <div className="flex items-center justify-between mb-2">
          <label className="text-sm font-medium text-gray-300">Conditional Logic</label>
          <button
            onClick={() => onUpdate(sectionIndex, questionIndex, {
              conditional: question.conditional ? null : { dependsOn: '', value: '' }
            })}
            className="text-blue-400 hover:text-blue-300 text-sm"
          >
            {question.conditional ? 'Remove Condition' : 'Add Condition'}
          </button>
        </div>
        
        {question.conditional && (
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-1">Depends on Question</label>
              <select
                value={question.conditional.dependsOn}
                onChange={(e) => onUpdate(sectionIndex, questionIndex, {
                  conditional: { ...question.conditional, dependsOn: e.target.value }
                })}
                className="w-full px-3 py-2 border border-gray-700 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 bg-gray-900 text-gray-100"
              >
                <option value="">Select a question...</option>
                {allQuestions
                  .filter(q => q.id !== question.id && (q.type === 'single-choice' || q.type === 'multi-choice'))
                  .map(q => (
                    <option key={q.id} value={q.id}>
                      {q.title}
                    </option>
                  ))
                }
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-1">Show when answer is</label>
              <input
                type="text"
                value={question.conditional.value}
                onChange={(e) => onUpdate(sectionIndex, questionIndex, {
                  conditional: { ...question.conditional, value: e.target.value }
                })}
                placeholder="e.g., Yes, Option 1"
                className="w-full px-3 py-2 border border-gray-700 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 bg-gray-900 text-gray-100 placeholder-gray-500"
              />
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

// Assessment Preview Component
function AssessmentPreview({ assessment, onSubmit }) {
  const [responses, setResponses] = useState({});
  const [errors, setErrors] = useState({});

  const handleResponseChange = (questionId, value) => {
    setResponses(prev => ({ ...prev, [questionId]: value }));
    // Clear error when user starts typing
    if (errors[questionId]) {
      setErrors(prev => ({ ...prev, [questionId]: null }));
    }
  };

  // Check if a question should be shown based on conditional logic
  const shouldShowQuestion = (question, allQuestions) => {
    if (!question.conditional) return true;
    
    const { dependsOn, value } = question.conditional;
    const dependentQuestion = allQuestions.find(q => q.id === dependsOn);
    
    if (!dependentQuestion) return true;
    
    const response = responses[dependsOn];
    if (!response) return false;
    
    // Handle different question types
    if (dependentQuestion.type === 'single-choice') {
      return response === value;
    } else if (dependentQuestion.type === 'multi-choice') {
      return Array.isArray(response) && response.includes(value);
    }
    
    return false;
  };

  const validateForm = () => {
    const newErrors = {};
    const allQuestions = assessment.sections.flatMap(s => s.questions);
    
    allQuestions.forEach(question => {
      if (question.required && shouldShowQuestion(question, allQuestions)) {
        const response = responses[question.id];
        if (!response || (Array.isArray(response) && response.length === 0)) {
          newErrors[question.id] = 'This field is required';
        }
      }
      
      // Validate numeric ranges
      if (question.type === 'numeric' && responses[question.id]) {
        const value = parseFloat(responses[question.id]);
        if (question.validation?.min !== undefined && value < question.validation.min) {
          newErrors[question.id] = `Value must be at least ${question.validation.min}`;
        }
        if (question.validation?.max !== undefined && value > question.validation.max) {
          newErrors[question.id] = `Value must be at most ${question.validation.max}`;
        }
      }
    });
    
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    if (validateForm()) {
      onSubmit(responses);
    }
  };

  const allQuestions = assessment.sections.flatMap(s => s.questions);

  return (
    <form onSubmit={handleSubmit} className="bg-gray-800 rounded-lg shadow-sm border border-gray-700 p-8 max-w-4xl mx-auto">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-100 mb-4">{assessment.title}</h1>
        {assessment.description && (
          <p className="text-gray-300 text-lg">{assessment.description}</p>
        )}
      </div>

      {assessment.sections.map((section, sectionIndex) => (
        <div key={section.id} className="mb-8">
          <div className="mb-6">
            <h2 className="text-xl font-semibold text-gray-100 mb-2">{section.title}</h2>
            {section.description && (
              <p className="text-gray-300">{section.description}</p>
            )}
          </div>

          <div className="space-y-6">
            {section.questions
              .filter(question => shouldShowQuestion(question, allQuestions))
              .map((question, questionIndex) => (
              <div key={question.id} className="space-y-2">
                <label className="block text-sm font-medium text-gray-100">
                  {question.title}
                  {question.required && <span className="text-red-500 ml-1">*</span>}
                </label>
                {question.description && (
                  <p className="text-gray-400 text-sm">{question.description}</p>
                )}
                
                {errors[question.id] && (
                  <p className="text-red-400 text-sm">{errors[question.id]}</p>
                )}

                {question.type === 'short-text' && (
                  <input
                    type="text"
                    value={responses[question.id] || ''}
                    onChange={(e) => handleResponseChange(question.id, e.target.value)}
                    className="w-full px-3 py-2 border border-gray-700 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 bg-gray-900 text-gray-100"
                  />
                )}

                {question.type === 'long-text' && (
                  <textarea
                    value={responses[question.id] || ''}
                    onChange={(e) => handleResponseChange(question.id, e.target.value)}
                    rows={4}
                    className="w-full px-3 py-2 border border-gray-700 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 bg-gray-900 text-gray-100"
                  />
                )}

                {question.type === 'single-choice' && (
                  <div className="space-y-2">
                    {(question.options || []).map((option, optionIndex) => (
                      <label key={optionIndex} className="flex items-center text-gray-200">
                        <input
                          type="radio"
                          name={question.id}
                          value={option}
                          checked={responses[question.id] === option}
                          onChange={(e) => handleResponseChange(question.id, e.target.value)}
                          className="mr-2"
                        />
                        {option}
                      </label>
                    ))}
                  </div>
                )}

                {question.type === 'multi-choice' && (
                  <div className="space-y-2">
                    {(question.options || []).map((option, optionIndex) => (
                      <label key={optionIndex} className="flex items-center text-gray-200">
                        <input
                          type="checkbox"
                          value={option}
                          checked={(responses[question.id] || []).includes(option)}
                          onChange={(e) => {
                            const currentValues = responses[question.id] || [];
                            const newValues = e.target.checked
                              ? [...currentValues, option]
                              : currentValues.filter(v => v !== option);
                            handleResponseChange(question.id, newValues);
                          }}
                          className="mr-2"
                        />
                        {option}
                      </label>
                    ))}
                  </div>
                )}

                {question.type === 'numeric' && (
                  <input
                    type="number"
                    min={question.validation?.min}
                    max={question.validation?.max}
                    value={responses[question.id] || ''}
                    onChange={(e) => handleResponseChange(question.id, e.target.value)}
                    className="w-full px-3 py-2 border border-gray-700 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 bg-gray-900 text-gray-100"
                  />
                )}

                {question.type === 'file-upload' && (
                  <div className="border-2 border-dashed border-gray-600 rounded-lg p-6 text-center">
                    <div className="text-gray-300">
                      📎 File upload placeholder
                    </div>
                    <div className="text-sm text-gray-400 mt-1">
                      (File upload functionality would be implemented here)
                    </div>
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      ))}

      <div className="mt-8 pt-6 border-t">
        <button 
          type="submit"
          className="bg-blue-600 text-white px-6 py-3 rounded-lg hover:bg-blue-700"
        >
          Submit Assessment
        </button>
      </div>
    </form>
  );
}
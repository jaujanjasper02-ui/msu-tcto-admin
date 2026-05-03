import React, { useState } from 'react';

const Documents = () => {
  const [templates, setTemplates] = useState([
    { id: 1, name: 'Transcript of Records (TOR)', type: 'Academic', status: 'active', lastUpdated: '2024-01-10' },
    { id: 2, name: 'Certificate of Enrollment', type: 'Certificate', status: 'active', lastUpdated: '2024-01-09' },
    { id: 3, name: 'Certificate of Good Moral', type: 'Certificate', status: 'active', lastUpdated: '2024-01-08' },
    { id: 4, name: 'Diploma', type: 'Academic', status: 'draft', lastUpdated: '2024-01-05' },
    { id: 5, name: 'Form 137', type: 'Academic', status: 'active', lastUpdated: '2024-01-04' },
    { id: 6, name: 'Certificate of Graduation', type: 'Certificate', status: 'inactive', lastUpdated: '2024-01-03' },
  ]);

  const [showAddModal, setShowAddModal] = useState(false);
  const [newTemplate, setNewTemplate] = useState({
    name: '',
    type: 'Academic',
    description: ''
  });

  const getStatusBadge = (status) => {
    const config = {
      active: { bg: 'bg-green-100', text: 'text-green-800', label: 'Active' },
      draft: { bg: 'bg-yellow-100', text: 'text-yellow-800', label: 'Draft' },
      inactive: { bg: 'bg-gray-100', text: 'text-gray-800', label: 'Inactive' },
    };
    const { bg, text, label } = config[status];
    return (
      <span className={`px-3 py-1 rounded-full text-xs font-medium ${bg} ${text}`}>
        {label}
      </span>
    );
  };

  const handleAddTemplate = () => {
    if (!newTemplate.name.trim()) {
      alert('Please enter template name');
      return;
    }
    
    const newId = templates.length + 1;
    const newTemplateObj = {
      id: newId,
      name: newTemplate.name,
      type: newTemplate.type,
      status: 'draft',
      lastUpdated: new Date().toISOString().split('T')[0]
    };
    
    setTemplates([...templates, newTemplateObj]);
    setShowAddModal(false);
    setNewTemplate({ name: '', type: 'Academic', description: '' });
  };

  const handleDownloadTemplate = (id) => {
    alert(`Downloading template ${id}`);
  };

  return (
    <div>
      {/* Header */}
      <div className="mb-8">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <h1 className="text-2xl md:text-3xl font-bold text-gray-900">Document Templates</h1>
            <p className="text-gray-600 mt-2">Manage and customize document templates</p>
          </div>
          <div className="flex gap-3">
            <button 
              onClick={() => setShowAddModal(true)}
              className="px-4 py-2 bg-maroon-600 text-white rounded-lg hover:bg-maroon-700 transition-colors flex items-center"
            >
              <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
              </svg>
              Add Template
            </button>
          </div>
        </div>
      </div>

      {/* Templates Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-8">
        {templates.map((template) => (
          <div key={template.id} className="bg-white rounded-xl border border-gray-200 p-6 hover:shadow-md transition-shadow">
            <div className="flex items-start justify-between mb-4">
              <div className="w-12 h-12 bg-maroon-100 rounded-lg flex items-center justify-center">
                <svg className="w-6 h-6 text-maroon-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                </svg>
              </div>
              <div>
                {getStatusBadge(template.status)}
              </div>
            </div>
            
            <h3 className="font-semibold text-gray-900 mb-2">{template.name}</h3>
            <div className="flex items-center text-sm text-gray-500 mb-4">
              <span className="bg-gray-100 px-2 py-1 rounded mr-2">{template.type}</span>
              <span>Updated: {template.lastUpdated}</span>
            </div>
            
            <div className="flex justify-between pt-4 border-t border-gray-100">
              <button 
                onClick={() => handleDownloadTemplate(template.id)}
                className="text-maroon-600 hover:text-maroon-800 font-medium text-sm"
              >
                Download
              </button>
              <div className="flex space-x-2">
                <button className="text-blue-600 hover:text-blue-800 text-sm">Edit</button>
                <button className="text-red-600 hover:text-red-800 text-sm">Delete</button>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Document Categories */}
      <div className="bg-white rounded-xl border border-gray-200 p-6 mb-8">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">Document Categories</h3>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="p-4 bg-blue-50 rounded-lg border border-blue-200">
            <div className="flex items-center">
              <div className="w-8 h-8 bg-blue-100 rounded-lg flex items-center justify-center mr-3">
                <svg className="w-4 h-4 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 14l9-5-9-5-9 5 9 5z" />
                </svg>
              </div>
              <div>
                <p className="font-medium text-gray-900">Academic Documents</p>
                <p className="text-sm text-gray-600">3 templates</p>
              </div>
            </div>
          </div>
          
          <div className="p-4 bg-green-50 rounded-lg border border-green-200">
            <div className="flex items-center">
              <div className="w-8 h-8 bg-green-100 rounded-lg flex items-center justify-center mr-3">
                <svg className="w-4 h-4 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              </div>
              <div>
                <p className="font-medium text-gray-900">Certificates</p>
                <p className="text-sm text-gray-600">2 templates</p>
              </div>
            </div>
          </div>
          
          <div className="p-4 bg-purple-50 rounded-lg border border-purple-200">
            <div className="flex items-center">
              <div className="w-8 h-8 bg-purple-100 rounded-lg flex items-center justify-center mr-3">
                <svg className="w-4 h-4 text-purple-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
                </svg>
              </div>
              <div>
                <p className="font-medium text-gray-900">Forms</p>
                <p className="text-sm text-gray-600">1 template</p>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Add Template Modal */}
      {showAddModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl max-w-md w-full p-6">
            <h3 className="text-lg font-bold text-gray-900 mb-4">Add New Template</h3>
            
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Template Name
                </label>
                <input
                  type="text"
                  value={newTemplate.name}
                  onChange={(e) => setNewTemplate({...newTemplate, name: e.target.value})}
                  className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-maroon-500 focus:border-transparent outline-none"
                  placeholder="e.g., Transcript of Records"
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Document Type
                </label>
                <select
                  value={newTemplate.type}
                  onChange={(e) => setNewTemplate({...newTemplate, type: e.target.value})}
                  className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-maroon-500 focus:border-transparent outline-none"
                >
                  <option value="Academic">Academic Document</option>
                  <option value="Certificate">Certificate</option>
                  <option value="Form">Form</option>
                  <option value="Letter">Letter</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Description (Optional)
                </label>
                <textarea
                  value={newTemplate.description}
                  onChange={(e) => setNewTemplate({...newTemplate, description: e.target.value})}
                  className="w-full h-24 px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-maroon-500 focus:border-transparent outline-none resize-none"
                  placeholder="Describe this template..."
                />
              </div>
            </div>

            <div className="flex justify-end space-x-3 mt-6">
              <button
                onClick={() => setShowAddModal(false)}
                className="px-4 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50"
              >
                Cancel
              </button>
              <button
                onClick={handleAddTemplate}
                className="px-4 py-2 bg-maroon-600 text-white rounded-lg hover:bg-maroon-700"
              >
                Add Template
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Documents;
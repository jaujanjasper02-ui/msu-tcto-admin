import React, { useState, useEffect } from 'react';
import { 
  FaSave, 
  FaSpinner, 
  FaEnvelope,
  FaClock,
  FaChartLine,
  FaFileAlt,
  FaBell,
  FaSlidersH,
  FaPlus,
  FaTrash,
  FaUserGraduate,
  FaUserTie,
  FaExclamationTriangle,
  FaCheckSquare,
  FaRegSquare
} from 'react-icons/fa';

const DEFAULT_DOCUMENT_SETTINGS = [
  { id: 1, name: 'Transcript of Records (TOR)', fee: 50, processing_days: 6, allowedRoles: ['alumni'] },
  { id: 2, name: 'Authentication', fee: 50, processing_days: 2, allowedRoles: ['alumni'] },
  { id: 3, name: 'Transfer Credential/Honorable Dismissal', fee: 50, processing_days: 3, allowedRoles: ['student', 'alumni'] },
  { id: 4, name: 'Report of Grade (ROG)', fee: 20, processing_days: 1, allowedRoles: ['student', 'alumni'] },
  { id: 5, name: 'Evaluation of Grades', fee: 20, processing_days: 1, allowedRoles: ['student', 'alumni'] },
  { id: 6, name: 'Certificate of Registration(COR)', fee: 5, processing_days: 1, allowedRoles: ['student'] },
  { id: 7, name: 'Reprinting Fee and (Grade)', fee: 5, processing_days: 1, allowedRoles: ['student', 'alumni'] },
  { id: 8, name: 'Certificate of Grade by semester Reprinting', fee: 5, processing_days: 1, allowedRoles: ['student', 'alumni'] },
  { id: 9, name: 'Certification', fee: 50, processing_days: 2, allowedRoles: ['student', 'alumni'] },
  { id: 10, name: 'CAV', fee: 150, processing_days: 2, allowedRoles: ['alumni'] },
  { id: 11, name: 'University Clearance Form', fee: 5, processing_days: 1, allowedRoles: ['student', 'alumni'] },
  { id: 12, name: 'INC Form', fee: 20, processing_days: 1, allowedRoles: ['student', 'alumni'] },
  { id: 13, name: 'Advance Credit/s Form and Substitution Form', fee: 20, processing_days: 1, allowedRoles: ['student', 'alumni'] },
  { id: 14, name: 'Application for Graduation Form', fee: 50, processing_days: 1, allowedRoles: ['student', 'alumni'] }
];

const Settings = () => {
  const [isSaving, setIsSaving] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [toast, setToast] = useState({ show: false, message: '', type: '' });

  const API_BASE_URL = import.meta.env.VITE_API_URL || 'https://msu-tcto-backend-nta0.onrender.com/api';

  const [settings, setSettings] = useState({
    contactEmail: '',
    officeHours: '',
    dailyQueueLimit: 100,
    avgProcessingTime: 10,
    maxCopiesPerRequest: 5,
    requirePurpose: true,
    emailNotifications: {
      onNewRequest: true,
      onStatusChange: true,
      onCompletion: true
    },
    documentSettings: DEFAULT_DOCUMENT_SETTINGS
  });

  const [showAddDocForm, setShowAddDocForm] = useState(false);
  const [newDoc, setNewDoc] = useState({ name: '', fee: 0, processing_days: 1, allowedRoles: ['student', 'alumni'] });
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [docToDelete, setDocToDelete] = useState(null);

  const showToast = (message, type = 'success') => {
    setToast({ show: true, message, type });
    setTimeout(() => setToast({ show: false, message: '', type: '' }), 3000);
  };

  useEffect(() => { fetchSettings(); }, []);

  const fetchSettings = async () => {
    setIsLoading(true);
    try {
      const token = localStorage.getItem('authToken');
      const response = await fetch(`${API_BASE_URL}/admin/settings`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      if (!response.ok) throw new Error('Failed to fetch settings');
      const data = await response.json();
      
      setSettings({
        contactEmail: data.settings.contact_email || '',
        officeHours: data.settings.office_hours || '',
        dailyQueueLimit: data.settings.daily_queue_limit || 100,
        avgProcessingTime: data.settings.avg_processing_time || 10,
        maxCopiesPerRequest: data.settings.max_copies_per_request || 5,
        requirePurpose: data.settings.require_purpose !== undefined ? data.settings.require_purpose : true,
        emailNotifications: data.settings.email_notifications || {
          onNewRequest: true, onStatusChange: true, onCompletion: true
        },
        documentSettings: (data.settings.document_settings && data.settings.document_settings.length > 0) 
          ? data.settings.document_settings : DEFAULT_DOCUMENT_SETTINGS
      });
    } catch (err) { showToast('Failed to load settings', 'error'); } 
    finally { setIsLoading(false); }
  };

  const handleInputChange = (key, value) => setSettings(prev => ({ ...prev, [key]: value }));
  
  const handleEmailNotifChange = (key, checked) => {
    setSettings(prev => ({ ...prev, emailNotifications: { ...prev.emailNotifications, [key]: checked } }));
  };

  const handleDocumentSettingChange = (id, field, value) => {
    setSettings(prev => ({
      ...prev,
      documentSettings: prev.documentSettings.map(doc => doc.id === id ? { ...doc, [field]: value } : doc)
    }));
  };

  // 🆕 ROLE TOGGLE — GAMIT ANG CHECKBOX LOGIC
  const handleRoleToggle = (id, role) => {
    setSettings(prev => ({
      ...prev,
      documentSettings: prev.documentSettings.map(doc => {
        if (doc.id !== id) return doc;
        const currentRoles = doc.allowedRoles || [];
        if (currentRoles.includes(role)) {
          return { ...doc, allowedRoles: currentRoles.filter(r => r !== role) };
        } else {
          return { ...doc, allowedRoles: [...currentRoles, role] };
        }
      })
    }));
  };

  const handleDeleteClick = (doc) => { setDocToDelete(doc); setShowDeleteConfirm(true); };
  
  const confirmDelete = () => {
    if (docToDelete) {
      setSettings(prev => ({
        ...prev,
        documentSettings: prev.documentSettings.filter(doc => doc.id !== docToDelete.id)
      }));
      showToast(`"${docToDelete.name}" removed! Click Save Changes to apply.`, 'info');
    }
    setShowDeleteConfirm(false); setDocToDelete(null);
  };

  const cancelDelete = () => { setShowDeleteConfirm(false); setDocToDelete(null); };

  const handleAddDocument = () => {
    if (!newDoc.name.trim()) { showToast('Document name is required', 'error'); return; }
    const maxId = settings.documentSettings.reduce((max, doc) => Math.max(max, doc.id), 0);
    const newDocument = {
      id: maxId + 1, name: newDoc.name.trim(), fee: newDoc.fee || 0,
      processing_days: newDoc.processing_days || 1, allowedRoles: newDoc.allowedRoles
    };
    setSettings(prev => ({ ...prev, documentSettings: [...prev.documentSettings, newDocument] }));
    setNewDoc({ name: '', fee: 0, processing_days: 1, allowedRoles: ['student', 'alumni'] });
    setShowAddDocForm(false);
    showToast('Document added! Click Save Changes to apply.', 'success');
  };

  // 🆕 NEW DOC ROLE TOGGLE — GAMIT ANG CHECKBOX LOGIC
  const handleNewDocRoleToggle = (role) => {
    setNewDoc(prev => {
      const currentRoles = prev.allowedRoles;
      if (currentRoles.includes(role)) return { ...prev, allowedRoles: currentRoles.filter(r => r !== role) };
      else return { ...prev, allowedRoles: [...currentRoles, role] };
    });
  };

  const handleSaveSettings = async () => {
    setIsSaving(true);
    try {
      const token = localStorage.getItem('authToken');
      const response = await fetch(`${API_BASE_URL}/admin/settings`, {
        method: 'PUT', headers: { 'Authorization': `Bearer ${token}`, 'Content-Type': 'application/json' },
        body: JSON.stringify(settings)
      });
      if (!response.ok) throw new Error('Failed to save settings');
      showToast('Settings saved successfully!', 'success');
    } catch (err) { showToast(err.message, 'error'); } 
    finally { setIsSaving(false); }
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="w-8 h-8 border-2 border-[#7A0019] border-t-transparent rounded-full animate-spin mx-auto mb-3"></div>
          <p className="text-gray-500 text-sm">Loading settings...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-6xl mx-auto px-4 py-6">
        
        {/* Toast */}
        {toast.show && (
          <div className={`fixed top-20 right-6 z-50 px-4 py-2 rounded-lg shadow-lg ${toast.type === 'success' ? 'bg-green-500' : toast.type === 'error' ? 'bg-red-500' : 'bg-blue-500'} text-white text-sm`}>
            {toast.message}
          </div>
        )}

        {/* Delete Confirmation Modal */}
        {showDeleteConfirm && (
          <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
            <div className="bg-white rounded-2xl shadow-2xl max-w-md w-full p-6 mx-4">
              <div className="flex items-center gap-3 mb-4">
                <div className="w-10 h-10 bg-red-100 rounded-full flex items-center justify-center">
                  <FaExclamationTriangle className="text-red-600 text-lg" />
                </div>
                <h3 className="text-lg font-bold text-gray-800">Confirm Delete</h3>
              </div>
              <p className="text-gray-600 mb-6">
                Are you sure you want to delete <strong className="text-red-600">"{docToDelete?.name}"</strong>? 
                This action cannot be undone after saving.
              </p>
              <div className="flex gap-3 justify-end">
                <button onClick={cancelDelete} className="px-4 py-2 bg-gray-100 text-gray-700 rounded-lg text-sm font-medium hover:bg-gray-200 transition">Cancel</button>
                <button onClick={confirmDelete} className="px-4 py-2 bg-red-600 text-white rounded-lg text-sm font-medium hover:bg-red-700 transition">Delete</button>
              </div>
            </div>
          </div>
        )}

        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-gradient-to-r from-[#7A0019] to-[#0038A8] rounded-lg flex items-center justify-center">
              <FaSlidersH className="text-white text-lg" />
            </div>
            <div>
              <h1 className="text-xl font-bold text-[#5F0231]">System Settings</h1>
              <p className="text-xs text-gray-500">Configure all system preferences</p>
            </div>
          </div>
          <button onClick={handleSaveSettings} disabled={isSaving}
            className="px-4 py-2 bg-[#7A0019] text-white text-sm font-medium rounded-lg hover:bg-[#5a0012] transition disabled:opacity-50 flex items-center gap-2">
            {isSaving ? <FaSpinner className="w-4 h-4 animate-spin" /> : <FaSave className="w-4 h-4" />}
            {isSaving ? 'Saving...' : 'Save'}
          </button>
        </div>

        <div className="space-y-6">
          
          {/* General Section */}
          <div className="bg-white rounded-lg border border-gray-200 p-5">
            <div className="flex items-center gap-2 mb-4">
              <FaEnvelope className="text-[#7A0019] text-sm" />
              <h2 className="text-sm font-semibold text-gray-800">General</h2>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Contact Email</label>
                <input type="email" value={settings.contactEmail} onChange={(e) => handleInputChange('contactEmail', e.target.value)}
                  className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:ring-1 focus:ring-[#7A0019] outline-none" placeholder="registrar@msutcto.edu.ph" />
                <p className="text-xs text-gray-400 mt-1">Primary email for inquiries</p>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Office Hours</label>
                <input type="text" value={settings.officeHours} onChange={(e) => handleInputChange('officeHours', e.target.value)}
                  className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:ring-1 focus:ring-[#7A0019] outline-none" placeholder="Mon-Fri, 8:00 AM - 5:00 PM" />
                <p className="text-xs text-gray-400 mt-1">Displayed on student dashboard</p>
              </div>
            </div>
          </div>

          {/* Queue Section */}
          <div className="bg-white rounded-lg border border-gray-200 p-5">
            <div className="flex items-center gap-2 mb-4">
              <FaChartLine className="text-[#7A0019] text-sm" />
              <h2 className="text-sm font-semibold text-gray-800">Queue</h2>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
              <div className="bg-gray-50 rounded-lg p-4">
                <label className="block text-sm font-medium text-gray-700 mb-2">Daily Queue Limit</label>
                <div className="flex items-center gap-2">
                  <input type="number" min="1" max="500" value={settings.dailyQueueLimit} onChange={(e) => handleInputChange('dailyQueueLimit', parseInt(e.target.value))}
                    className="w-24 px-3 py-2 border border-gray-200 rounded-lg text-center text-sm focus:ring-1 focus:ring-[#7A0019] outline-none" />
                  <span className="text-gray-500 text-sm">requests/day</span>
                </div>
                <p className="text-xs text-gray-400 mt-2">Max requests per student per day</p>
              </div>
              <div className="bg-gray-50 rounded-lg p-4">
                <label className="block text-sm font-medium text-gray-700 mb-2">Avg Processing Time</label>
                <div className="flex items-center gap-2">
                  <input type="number" min="1" max="60" value={settings.avgProcessingTime} onChange={(e) => handleInputChange('avgProcessingTime', parseInt(e.target.value))}
                    className="w-24 px-3 py-2 border border-gray-200 rounded-lg text-center text-sm focus:ring-1 focus:ring-[#7A0019] outline-none" />
                  <span className="text-gray-500 text-sm">minutes/request</span>
                </div>
                <p className="text-xs text-gray-400 mt-2">For wait time calculation</p>
              </div>
            </div>
          </div>

          {/* Documents Section */}
          <div className="bg-white rounded-lg border border-gray-200 p-5">
            <div className="flex items-center gap-2 mb-4">
              <FaFileAlt className="text-[#7A0019] text-sm" />
              <h2 className="text-sm font-semibold text-gray-800">Documents</h2>
            </div>
            
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-5">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Max Copies per Request</label>
                <input type="number" min="1" max="10" value={settings.maxCopiesPerRequest} onChange={(e) => handleInputChange('maxCopiesPerRequest', parseInt(e.target.value))}
                  className="w-24 px-3 py-2 border border-gray-200 rounded-lg text-center text-sm focus:ring-1 focus:ring-[#7A0019] outline-none" />
              </div>
              <div className="flex items-center pt-6">
                <label className="flex items-center cursor-pointer">
                  <input type="checkbox" checked={settings.requirePurpose} onChange={(e) => handleInputChange('requirePurpose', e.target.checked)}
                    className="w-4 h-4 text-[#7A0019] border-gray-300 rounded focus:ring-[#7A0019]" />
                  <span className="ml-2 text-sm text-gray-700">Require purpose for requests</span>
                </label>
              </div>
            </div>

            {/* Add Document Button */}
            <div className="mb-4 flex items-center justify-between">
              <h3 className="text-sm font-semibold text-gray-700">Document Fees & Processing Times</h3>
              <button onClick={() => setShowAddDocForm(!showAddDocForm)}
                className="px-3 py-1.5 bg-[#7A0019] text-white text-xs font-medium rounded-lg hover:bg-[#5a0012] transition flex items-center gap-1">
                <FaPlus className="w-3 h-3" /> Add Document
              </button>
            </div>

            {/* Add New Document Form */}
            {showAddDocForm && (
              <div className="mb-4 p-4 bg-gradient-to-r from-[#7A0019]/5 to-[#0038A8]/5 border border-[#7A0019]/20 rounded-lg">
                <p className="text-sm font-semibold text-gray-700 mb-3">Add New Document/Form</p>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 mb-3">
                  <input type="text" placeholder="Document Name" value={newDoc.name} onChange={(e) => setNewDoc({...newDoc, name: e.target.value})}
                    className="px-3 py-2 border border-gray-200 rounded-lg text-sm focus:ring-1 focus:ring-[#7A0019] outline-none" />
                  <div className="flex items-center gap-1">
                    <span className="text-gray-500 text-xs font-bold">₱</span>
                    <input type="number" min="0" step="5" value={newDoc.fee} onChange={(e) => setNewDoc({...newDoc, fee: parseFloat(e.target.value)})}
                      className="w-20 px-2 py-2 border border-gray-200 rounded-lg text-sm focus:ring-1 focus:ring-[#7A0019] outline-none" />
                  </div>
                  <input type="number" min="1" max="30" value={newDoc.processing_days} onChange={(e) => setNewDoc({...newDoc, processing_days: parseInt(e.target.value)})}
                    className="w-16 px-2 py-2 border border-gray-200 rounded-lg text-sm text-center focus:ring-1 focus:ring-[#7A0019] outline-none" />
                </div>
                <div className="flex items-center gap-4 mb-3">
                  <span className="text-xs text-gray-600">For:</span>
                  <label className="flex items-center gap-1.5 cursor-pointer">
                    <input type="checkbox" checked={newDoc.allowedRoles.includes('student')} onChange={() => handleNewDocRoleToggle('student')}
                      className="w-4 h-4 rounded accent-[#285ccc]" />
                    <FaUserGraduate className="text-[#285ccc] text-sm" />
                    <span className="text-xs text-gray-700">Student</span>
                  </label>
                  <label className="flex items-center gap-1.5 cursor-pointer">
                    <input type="checkbox" checked={newDoc.allowedRoles.includes('alumni')} onChange={() => handleNewDocRoleToggle('alumni')}
                      className="w-4 h-4 rounded accent-[#780115]" />
                    <FaUserTie className="text-[#780115] text-sm" />
                    <span className="text-xs text-gray-700">Alumni</span>
                  </label>
                </div>
                <div className="flex gap-2">
                  <button onClick={handleAddDocument} className="px-4 py-2 bg-[#7A0019] text-white text-xs font-medium rounded-lg hover:bg-[#5a0012] transition">Add</button>
                  <button onClick={() => setShowAddDocForm(false)} className="px-4 py-2 bg-gray-200 text-gray-700 text-xs font-medium rounded-lg hover:bg-gray-300 transition">Cancel</button>
                </div>
              </div>
            )}

            {/* Document Table */}
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-gray-200">
                    <th className="px-3 py-2 text-left text-xs font-medium text-gray-500">Document Type</th>
                    <th className="px-3 py-2 text-left text-xs font-medium text-gray-500">Fee (₱)</th>
                    <th className="px-3 py-2 text-left text-xs font-medium text-gray-500">Processing Days</th>
                    <th className="px-3 py-2 text-center text-xs font-medium text-gray-500">Student/Alumni</th>
                    <th className="px-3 py-2 text-center text-xs font-medium text-gray-500">Action</th>
                  </tr>
                </thead>
                <tbody>
                  {settings.documentSettings.map((doc) => (
                    <tr key={doc.id} className="border-b border-gray-50 hover:bg-gray-50">
                      <td className="px-3 py-2">
                        <input type="text" value={doc.name} onChange={(e) => handleDocumentSettingChange(doc.id, 'name', e.target.value)}
                          className="w-full px-2 py-1 border border-transparent hover:border-gray-200 rounded text-sm focus:ring-1 focus:ring-[#7A0019] outline-none bg-transparent" />
                      </td>
                      <td className="px-3 py-2">
                        <div className="flex items-center gap-1">
                          <span className="text-gray-500 text-xs font-bold">₱</span>
                          <input type="number" min="0" step="5" value={doc.fee} onChange={(e) => handleDocumentSettingChange(doc.id, 'fee', parseFloat(e.target.value))}
                            className="w-20 px-2 py-1 border border-gray-200 rounded text-sm focus:ring-1 focus:ring-[#7A0019] outline-none" />
                        </div>
                      </td>
                      <td className="px-3 py-2">
                        <input type="number" min="1" max="30" value={doc.processing_days} onChange={(e) => handleDocumentSettingChange(doc.id, 'processing_days', parseInt(e.target.value))}
                          className="w-16 px-2 py-1 border border-gray-200 rounded text-sm text-center focus:ring-1 focus:ring-[#7A0019] outline-none" />
                      </td>
                      {/* 🆕 CHECKBOX COLUMN */}
                      <td className="px-3 py-2">
                        <div className="flex items-center justify-center gap-3">
                          <label className="flex items-center gap-1 cursor-pointer" title="Student">
                            <input type="checkbox" checked={(doc.allowedRoles || []).includes('student')} onChange={() => handleRoleToggle(doc.id, 'student')}
                              className="w-4 h-4 rounded accent-[#285ccc]" />
                            <FaUserGraduate className="text-[#285ccc] text-xs" />
                          </label>
                          <label className="flex items-center gap-1 cursor-pointer" title="Alumni">
                            <input type="checkbox" checked={(doc.allowedRoles || []).includes('alumni')} onChange={() => handleRoleToggle(doc.id, 'alumni')}
                              className="w-4 h-4 rounded accent-[#780115]" />
                            <FaUserTie className="text-[#780115] text-xs" />
                          </label>
                        </div>
                      </td>
                      <td className="px-3 py-2 text-center">
                        <button onClick={() => handleDeleteClick(doc)}
                          className="p-1.5 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition" title="Delete document">
                          <FaTrash className="w-3.5 h-3.5" />
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          {/* Notifications Section */}
          <div className="bg-white rounded-lg border border-gray-200 p-5">
            <div className="flex items-center gap-2 mb-4">
              <FaBell className="text-[#7A0019] text-sm" />
              <h2 className="text-sm font-semibold text-gray-800">Notifications</h2>
            </div>
            <div className="space-y-3">
              {[
                { key: 'onNewRequest', title: 'New Request Submitted', desc: 'Email when student submits a request' },
                { key: 'onStatusChange', title: 'Status Change', desc: 'Email when request status is updated' },
                { key: 'onCompletion', title: 'Request Ready for Pickup', desc: 'Email when document is ready to claim' }
              ].map((item) => (
                <div key={item.key} className="flex items-center justify-between py-2 border-b border-gray-100 last:border-b-0">
                  <div>
                    <p className="text-sm font-medium text-gray-700">{item.title}</p>
                    <p className="text-xs text-gray-400">{item.desc}</p>
                  </div>
                  <label className="relative inline-flex items-center cursor-pointer">
                    <input type="checkbox" checked={settings.emailNotifications?.[item.key] || false} onChange={(e) => handleEmailNotifChange(item.key, e.target.checked)} className="sr-only peer" />
                    <div className="w-9 h-5 bg-gray-200 rounded-full peer peer-checked:after:translate-x-full after:absolute after:top-[2px] after:left-[2px] after:bg-white after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:bg-[#7A0019]"></div>
                  </label>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Settings;
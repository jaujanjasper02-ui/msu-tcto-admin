import React, { useState, useEffect } from 'react';
import { 
  FaSave, 
  FaSpinner, 
  FaCheckCircle, 
  FaTimesCircle,
  FaBuilding,
  FaEnvelope,
  FaClock,
  FaChartLine,
  FaFileAlt,
  FaCalendarAlt,
  FaBell,
  FaSlidersH,
  FaRegClock
} from 'react-icons/fa';

const Settings = () => {
  const [activeTab, setActiveTab] = useState('general');
  const [isSaving, setIsSaving] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [toast, setToast] = useState({ show: false, message: '', type: '' });

  const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000/api';

  const [settings, setSettings] = useState({
    systemName: '',
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
    documentSettings: []
  });

  const showToast = (message, type = 'success') => {
    setToast({ show: true, message, type });
    setTimeout(() => setToast({ show: false, message: '', type: '' }), 3000);
  };

  useEffect(() => {
    fetchSettings();
  }, []);

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
        systemName: data.settings.system_name || '',
        contactEmail: data.settings.contact_email || '',
        officeHours: data.settings.office_hours || '',
        dailyQueueLimit: data.settings.daily_queue_limit || 100,
        avgProcessingTime: data.settings.avg_processing_time || 10,
        maxCopiesPerRequest: data.settings.max_copies_per_request || 5,
        requirePurpose: data.settings.require_purpose !== undefined ? data.settings.require_purpose : true,
        emailNotifications: data.settings.email_notifications || {
          onNewRequest: true,
          onStatusChange: true,
          onCompletion: true
        },
        documentSettings: data.settings.document_settings || []
      });
    } catch (err) {
      showToast('Failed to load settings', 'error');
    } finally {
      setIsLoading(false);
    }
  };

  const handleInputChange = (key, value) => {
    setSettings(prev => ({ ...prev, [key]: value }));
  };

  const handleEmailNotifChange = (key, checked) => {
    setSettings(prev => ({
      ...prev,
      emailNotifications: {
        ...prev.emailNotifications,
        [key]: checked
      }
    }));
  };

  const handleDocumentSettingChange = (id, field, value) => {
    setSettings(prev => ({
      ...prev,
      documentSettings: prev.documentSettings.map(doc => 
        doc.id === id ? { ...doc, [field]: value } : doc
      )
    }));
  };

  const handleSaveSettings = async () => {
    setIsSaving(true);
    try {
      const token = localStorage.getItem('authToken');
      const response = await fetch(`${API_BASE_URL}/admin/settings`, {
        method: 'PUT',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(settings)
      });

      if (!response.ok) throw new Error('Failed to save settings');

      showToast('Settings saved successfully!', 'success');
    } catch (err) {
      showToast(err.message, 'error');
    } finally {
      setIsSaving(false);
    }
  };

  const tabs = [
    { id: 'general', label: 'General', icon: FaBuilding },
    { id: 'queue', label: 'Queue', icon: FaChartLine },
    { id: 'documents', label: 'Documents', icon: FaFileAlt },
    { id: 'notifications', label: 'Notifications', icon: FaBell }
  ];

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
        
        {/* Toast Notification */}
        {toast.show && (
          <div className={`fixed top-20 right-6 z-50 px-4 py-2 rounded-lg shadow-lg ${toast.type === 'success' ? 'bg-green-500' : 'bg-red-500'} text-white text-sm`}>
            {toast.message}
          </div>
        )}

        {/* ========== HEADER ========== */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-gradient-to-r from-[#7A0019] to-[#0038A8] rounded-lg flex items-center justify-center">
              <FaSlidersH className="text-white text-lg" />
            </div>
            <div>
              <h1 className="text-xl font-bold text-gray-800">System Settings</h1>
              <p className="text-xs text-gray-500">Configure system preferences</p>
            </div>
          </div>
          
          <button
            onClick={handleSaveSettings}
            disabled={isSaving}
            className="px-4 py-2 bg-[#7A0019] text-white text-sm font-medium rounded-lg hover:bg-[#5a0012] transition disabled:opacity-50 flex items-center gap-2"
          >
            {isSaving ? <FaSpinner className="w-4 h-4 animate-spin" /> : <FaSave className="w-4 h-4" />}
            {isSaving ? 'Saving...' : 'Save Changes'}
          </button>
        </div>

        {/* ========== SETTINGS CONTAINER ========== */}
        <div className="bg-white rounded-lg border border-gray-200 overflow-hidden">
          
          {/* ========== TABS ========== */}
          <div className="border-b border-gray-200 bg-gray-50">
            <div className="flex">
              {tabs.map((tab) => {
                const Icon = tab.icon;
                const isActive = activeTab === tab.id;
                return (
                  <button
                    key={tab.id}
                    onClick={() => setActiveTab(tab.id)}
                    className={`flex items-center gap-2 px-4 py-3 text-sm font-medium transition ${
                      isActive 
                        ? 'text-[#7A0019] border-b-2 border-[#7A0019] bg-white' 
                        : 'text-gray-500 hover:text-gray-700'
                    }`}
                  >
                    <Icon className="w-4 h-4" />
                    {tab.label}
                  </button>
                );
              })}
            </div>
          </div>

          {/* ========== TAB CONTENT ========== */}
          <div className="p-5">
            
            {/* ===== GENERAL SETTINGS ===== */}
            {activeTab === 'general' && (
              <div className="space-y-5">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    <FaBuilding className="inline mr-1 text-gray-400 text-xs" /> System Name
                  </label>
                  <input
                    type="text"
                    value={settings.systemName}
                    onChange={(e) => handleInputChange('systemName', e.target.value)}
                    className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:ring-1 focus:ring-[#7A0019] focus:border-[#7A0019] outline-none"
                    placeholder="MSU-TCTO Registrar System"
                  />
                  <p className="text-xs text-gray-400 mt-1">Displayed throughout the system</p>
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    <FaEnvelope className="inline mr-1 text-gray-400 text-xs" /> Contact Email
                  </label>
                  <input
                    type="email"
                    value={settings.contactEmail}
                    onChange={(e) => handleInputChange('contactEmail', e.target.value)}
                    className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:ring-1 focus:ring-[#7A0019] focus:border-[#7A0019] outline-none"
                    placeholder="registrar@msutcto.edu.ph"
                  />
                  <p className="text-xs text-gray-400 mt-1">Primary email for inquiries</p>
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    <FaClock className="inline mr-1 text-gray-400 text-xs" /> Office Hours
                  </label>
                  <input
                    type="text"
                    value={settings.officeHours}
                    onChange={(e) => handleInputChange('officeHours', e.target.value)}
                    className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:ring-1 focus:ring-[#7A0019] focus:border-[#7A0019] outline-none"
                    placeholder="Mon-Fri, 8:00 AM - 5:00 PM"
                  />
                  <p className="text-xs text-gray-400 mt-1">Displayed on student dashboard</p>
                </div>
              </div>
            )}

            {/* ===== QUEUE SETTINGS ===== */}
            {activeTab === 'queue' && (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
                <div className="bg-gray-50 rounded-lg p-4">
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Daily Queue Limit
                  </label>
                  <div className="flex items-center gap-2">
                    <input
                      type="number"
                      min="1"
                      max="500"
                      value={settings.dailyQueueLimit}
                      onChange={(e) => handleInputChange('dailyQueueLimit', parseInt(e.target.value))}
                      className="w-24 px-3 py-2 border border-gray-200 rounded-lg text-center text-sm focus:ring-1 focus:ring-[#7A0019] outline-none"
                    />
                    <span className="text-gray-500 text-sm">requests/day</span>
                  </div>
                  <p className="text-xs text-gray-400 mt-2">Max requests per student per day</p>
                </div>
                
                <div className="bg-gray-50 rounded-lg p-4">
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Avg Processing Time
                  </label>
                  <div className="flex items-center gap-2">
                    <input
                      type="number"
                      min="1"
                      max="60"
                      value={settings.avgProcessingTime}
                      onChange={(e) => handleInputChange('avgProcessingTime', parseInt(e.target.value))}
                      className="w-24 px-3 py-2 border border-gray-200 rounded-lg text-center text-sm focus:ring-1 focus:ring-[#7A0019] outline-none"
                    />
                    <span className="text-gray-500 text-sm">minutes/request</span>
                  </div>
                  <p className="text-xs text-gray-400 mt-2">For wait time calculation</p>
                </div>
              </div>
            )}

            {/* ===== DOCUMENT SETTINGS ===== */}
            {activeTab === 'documents' && (
              <div>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-5">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Max Copies per Request
                    </label>
                    <input
                      type="number"
                      min="1"
                      max="10"
                      value={settings.maxCopiesPerRequest}
                      onChange={(e) => handleInputChange('maxCopiesPerRequest', parseInt(e.target.value))}
                      className="w-24 px-3 py-2 border border-gray-200 rounded-lg text-center text-sm focus:ring-1 focus:ring-[#7A0019] outline-none"
                    />
                  </div>
                  
                  <div className="flex items-center pt-6">
                    <label className="flex items-center cursor-pointer">
                      <input
                        type="checkbox"
                        checked={settings.requirePurpose}
                        onChange={(e) => handleInputChange('requirePurpose', e.target.checked)}
                        className="w-4 h-4 text-[#7A0019] border-gray-300 rounded focus:ring-[#7A0019]"
                      />
                      <span className="ml-2 text-sm text-gray-700">Require purpose for requests</span>
                    </label>
                  </div>
                </div>

                <div className="border-t border-gray-100 pt-4">
                  <h3 className="text-sm font-semibold text-gray-700 mb-3">Document Fees & Processing Times</h3>
                  <div className="overflow-x-auto">
                    <table className="w-full text-sm">
                      <thead>
                        <tr className="border-b border-gray-200">
                          <th className="px-3 py-2 text-left text-xs font-medium text-gray-500">Document Type</th>
                          <th className="px-3 py-2 text-left text-xs font-medium text-gray-500">Fee (₱)</th>
                          <th className="px-3 py-2 text-left text-xs font-medium text-gray-500">Days</th>
                        </tr>
                      </thead>
                      <tbody>
                        {settings.documentSettings.map((doc) => (
                          <tr key={doc.id} className="border-b border-gray-50">
                            <td className="px-3 py-2 text-sm text-gray-700">{doc.name}</td>
                            <td className="px-3 py-2">
                              <div className="flex items-center gap-1">
                                <span className="text-gray-500 text-xs font-bold">₱</span>
                                <input
                                  type="number"
                                  min="0"
                                  step="5"
                                  value={doc.fee}
                                  onChange={(e) => handleDocumentSettingChange(doc.id, 'fee', parseFloat(e.target.value))}
                                  className="w-20 px-2 py-1 border border-gray-200 rounded text-sm focus:ring-1 focus:ring-[#7A0019] outline-none"
                                />
                              </div>
                            </td>
                            <td className="px-3 py-2">
                              <input
                                type="number"
                                min="1"
                                max="30"
                                value={doc.processing_days}
                                onChange={(e) => handleDocumentSettingChange(doc.id, 'processing_days', parseInt(e.target.value))}
                                className="w-16 px-2 py-1 border border-gray-200 rounded text-sm text-center focus:ring-1 focus:ring-[#7A0019] outline-none"
                              />
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              </div>
            )}

            {/* ===== NOTIFICATION SETTINGS ===== */}
            {activeTab === 'notifications' && (
              <div className="space-y-3">
                <div className="flex items-center justify-between py-2 border-b border-gray-100">
                  <div>
                    <p className="text-sm font-medium text-gray-700">New Request Submitted</p>
                    <p className="text-xs text-gray-400">Email when student submits a request</p>
                  </div>
                  <label className="relative inline-flex items-center cursor-pointer">
                    <input
                      type="checkbox"
                      checked={settings.emailNotifications?.onNewRequest || false}
                      onChange={(e) => handleEmailNotifChange('onNewRequest', e.target.checked)}
                      className="sr-only peer"
                    />
                    <div className="w-9 h-5 bg-gray-200 rounded-full peer peer-checked:after:translate-x-full after:absolute after:top-[2px] after:left-[2px] after:bg-white after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:bg-[#7A0019]"></div>
                  </label>
                </div>
                
                <div className="flex items-center justify-between py-2 border-b border-gray-100">
                  <div>
                    <p className="text-sm font-medium text-gray-700">Status Change</p>
                    <p className="text-xs text-gray-400">Email when request status is updated</p>
                  </div>
                  <label className="relative inline-flex items-center cursor-pointer">
                    <input
                      type="checkbox"
                      checked={settings.emailNotifications?.onStatusChange || false}
                      onChange={(e) => handleEmailNotifChange('onStatusChange', e.target.checked)}
                      className="sr-only peer"
                    />
                    <div className="w-9 h-5 bg-gray-200 rounded-full peer peer-checked:after:translate-x-full after:absolute after:top-[2px] after:left-[2px] after:bg-white after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:bg-[#7A0019]"></div>
                  </label>
                </div>
                
                <div className="flex items-center justify-between py-2">
                  <div>
                    <p className="text-sm font-medium text-gray-700">Request Ready for Pickup</p>
                    <p className="text-xs text-gray-400">Email when document is ready to claim</p>
                  </div>
                  <label className="relative inline-flex items-center cursor-pointer">
                    <input
                      type="checkbox"
                      checked={settings.emailNotifications?.onCompletion || false}
                      onChange={(e) => handleEmailNotifChange('onCompletion', e.target.checked)}
                      className="sr-only peer"
                    />
                    <div className="w-9 h-5 bg-gray-200 rounded-full peer peer-checked:after:translate-x-full after:absolute after:top-[2px] after:left-[2px] after:bg-white after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:bg-[#7A0019]"></div>
                  </label>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default Settings;
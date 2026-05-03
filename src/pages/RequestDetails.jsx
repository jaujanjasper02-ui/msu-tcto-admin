import React, { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import StatusBadge from '../components/StatusBadge';
import { ConfirmationModal } from '../components/Modal';

const RequestDetails = () => {
  const { id } = useParams(); // This will be the tracking code (e.g., REQ-20260305-8047)
  
  const [request, setRequest] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [status, setStatus] = useState('');
  const [notes, setNotes] = useState('');
  const [showStatusModal, setShowStatusModal] = useState(false);
  const [showRejectModal, setShowRejectModal] = useState(false);
  const [showClaimModal, setShowClaimModal] = useState(false);
  const [rejectReason, setRejectReason] = useState('');
  const [selectedStatus, setSelectedStatus] = useState('');
  const [emailMessage, setEmailMessage] = useState('');
  const [isRestricted, setIsRestricted] = useState(false);
  const [updating, setUpdating] = useState(false);

  const API_BASE_URL = 'http://localhost:5000/api';

  // Restricted documents list
  const RESTRICTED_DOCUMENTS = [
    'Transcript of Records (TOR)',
    'Diploma',
    'CAV',
    'Authentication',
    'Transfer Credential',
    'Honorable Dismissal',
    'Form 137',
    'Certificate of Graduation'
  ];

  // Fetch request data
  useEffect(() => {
    const fetchRequest = async () => {
      setLoading(true);
      try {
        const token = localStorage.getItem('authToken');
        
        if (!token) {
          setError('You are not logged in. Please login to continue.');
          setLoading(false);
          return;
        }

        console.log('🔍 Fetching request with tracking code:', id);

        const response = await fetch(`${API_BASE_URL}/requests/requestbyid/${id}`, {
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json'
          }
        });

        const data = await response.json();

        if (!response.ok) {
          throw new Error(data.message || data.error || 'Failed to fetch request');
        }

        console.log('✅ Request data received:', data);
        setRequest(data);
        setStatus(data.status);
        
        // Check if this request is restricted
        const restricted = data.studentType === 'Student' && 
                          RESTRICTED_DOCUMENTS.some(doc => data.documentType.includes(doc));
        setIsRestricted(restricted);

      } catch (err) {
        console.error('❌ Error fetching request:', err);
        setError(err.message || 'Failed to load request details');
      } finally {
        setLoading(false);
      }
    };

    if (id) {
      fetchRequest();
    }
  }, [id]);

  // Function to get year display based on student type
  const getYearDisplay = () => {
    if (!request) return 'N/A';
    if (request.studentType === 'Alumni') {
      return `Graduated ${request.yearGraduated || 'N/A'}`;
    }
    return request.yearLevel || 'N/A';
  };

  // Email Templates (removed SMS)
  const emailTemplates = {
    approved: `Your request {REQ_ID} for {DOCUMENT} is APPROVED and now PROCESSING.
Amount to pay: ₱{AMOUNT}
Payment: Pay at Cashier Office on your claim date.
Processing time: {PROCESSING_TIME}
We will notify you once ready for pickup.
Thank you!`,
    ready: `Your {DOCUMENT} is READY FOR PICKUP!
1. Go to Cashier Office: Pay ₱{AMOUNT} & get Official Receipt
2. Go to Registrar Office: Present OR + Valid ID
3. Claim your document
Claim within 30 days.
Thank you!`,
    rejected: `Your request {REQ_ID} for {DOCUMENT} has been REJECTED.
Reason: {REASON}
If you have questions, please contact the Registrar's Office.
Thank you.`
  };

  // ===========================================
  // UPDATE STATUS FUNCTION
  // ===========================================
  const updateStatus = async (newStatus, reason = null) => {
    try {
      const token = localStorage.getItem('authToken');
      
      const payload = {
        status: newStatus,
        ...(reason && { reason })
      };

      console.log(`📤 Updating status to ${newStatus}:`, payload);

      const response = await fetch(`${API_BASE_URL}/requests/${id}/status`, {
        method: 'PUT',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(payload)
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || 'Failed to update status');
      }

      console.log(`✅ Status updated to ${newStatus}:`, data);

      // Update local state
      setStatus(newStatus);
      
      // Add to history
      const newHistory = {
        status: newStatus,
        timestamp: new Date().toISOString(),
        action: newStatus === 'approved' ? 'Request approved' :
                newStatus === 'processing' ? 'Request processing started' :
                newStatus === 'ready' ? 'Document ready for pickup' :
                newStatus === 'claimed' ? 'Document claimed by student' :
                newStatus === 'rejected' ? `Request rejected: ${reason}` : newStatus,
        user: 'Admin User',
        reason: reason
      };
      
      setRequest(prev => ({
        ...prev,
        history: [newHistory, ...(prev.history || [])]
      }));

      return true;

    } catch (err) {
      console.error(`❌ Error updating to ${newStatus}:`, err);
      throw err;
    }
  };

  const handleStatusChange = (newStatus) => {
    setSelectedStatus(newStatus);
    
    if (newStatus === 'approved') {
      setEmailMessage(emailTemplates.approved
        .replace('{REQ_ID}', request.id)
        .replace('{DOCUMENT}', request.documentType)
        .replace('{AMOUNT}', request.amount)
        .replace('{PROCESSING_TIME}', request.processingTime));
      setShowStatusModal(true);
    } else if (newStatus === 'ready') {
      setEmailMessage(emailTemplates.ready
        .replace('{DOCUMENT}', request.documentType)
        .replace('{AMOUNT}', request.amount));
      setShowStatusModal(true);
    }
  };

  const handleRejectClick = () => {
    setShowRejectModal(true);
  };

  const handleClaimClick = () => {
    setShowClaimModal(true);
  };

  const confirmReject = async () => {
    if (!rejectReason.trim()) {
      alert('Please provide a reason for rejection');
      return;
    }
    
    const success = await updateStatus('rejected', rejectReason);
    
    if (success) {
      alert(`❌ Request rejected.\n✅ Notification sent to ${request.email}\n\nReason: ${rejectReason}`);
      setShowRejectModal(false);
      setRejectReason('');
    }
  };

  const confirmClaim = async () => {
    const success = await updateStatus('claimed');
    
    if (success) {
      alert(`✅ Request marked as claimed. No notification sent to student.`);
      setShowClaimModal(false);
    }
  };

  const confirmStatusChange = async () => {
    setUpdating(true);
    
    try {
      if (selectedStatus === 'approved') {
        console.log('📤 Step 1: Updating to approved');
        const approvedResult = await updateStatus('approved');
        
        if (approvedResult) {
          console.log('📤 Step 2: Updating to processing');
          const processingResult = await updateStatus('processing');
          
          if (processingResult) {
            alert(`✅ Email sent to ${request.email}\n\nMessage:\n${emailMessage}`);
          }
        }
      } else if (selectedStatus === 'ready') {
        const success = await updateStatus('ready');
        if (success) {
          alert(`✅ Email sent to ${request.email}\n\nMessage:\n${emailMessage}`);
        }
      }
      
      setShowStatusModal(false);
    } catch (error) {
      console.error('❌ Error in status update:', error);
      alert('Failed to update status');
    } finally {
      setUpdating(false);
    }
  };

  const getUserTypeBadge = (type) => {
    switch(type) {
      case 'Student':
        return 'bg-blue-100 text-blue-800';
      case 'Alumni':
        return 'bg-purple-100 text-purple-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  if (loading) {
    return (
      <div className="p-6 flex justify-center items-center min-h-screen">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-maroon-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading request details...</p>
        </div>
      </div>
    );
  }

  if (error || !request) {
    return (
      <div className="p-6">
        <div className="bg-red-50 border border-red-200 rounded-xl p-6 text-center">
          <svg className="w-12 h-12 text-red-500 mx-auto mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
          <h3 className="text-lg font-medium text-red-800 mb-2">Failed to Load Request</h3>
          <p className="text-red-600 mb-4">{error || 'Request not found'}</p>
          <Link 
            to="/admin/requests"
            className="inline-flex items-center px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors"
          >
            Back to Requests
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header with Back Button */}
      <div>
        <Link 
          to="/admin/requests" 
          className="inline-flex items-center text-sm text-gray-600 hover:text-[#7A0019] mb-4"
        >
          <svg className="w-4 h-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
          </svg>
          Back to Requests
        </Link>
        
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-3">
              <h1 className="text-2xl font-semibold text-gray-900">Request Details</h1>
              <span className="font-mono text-sm bg-gray-100 px-3 py-1 rounded-md text-gray-700">
                {request.id}
              </span>
            </div>
            <div className="flex items-center gap-2 mt-2">
              <StatusBadge status={status} size="lg" />
              <span className={`inline-flex px-2.5 py-1 text-xs font-medium rounded-full ${getUserTypeBadge(request.studentType)}`}>
                {request.studentType}
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* 🔴 RESTRICTED DOCUMENT WARNING */}
      {isRestricted && (
        <div className="bg-red-50 border-l-4 border-red-600 rounded-r-lg p-4 shadow-sm">
          <div className="flex items-start">
            <div className="flex-shrink-0">
              <svg className="h-5 w-5 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
              </svg>
            </div>
            <div className="ml-3">
              <h3 className="text-sm font-bold text-red-800">⚠️ RESTRICTED DOCUMENT</h3>
              <div className="mt-2 text-sm text-red-700">
                <p className="font-semibold">{request.documentType}</p>
                <p className="mt-1">
                  <strong>{request.studentType}</strong> is <span className="underline">NOT ALLOWED</span> to request this document.
                </p>
                <p className="mt-1">
                  ✅ Only <strong>Alumni</strong> can request:
                </p>
                <ul className="list-disc list-inside mt-1 ml-2">
                  <li>Transcript of Records (TOR)</li>
                  <li>Diploma</li>
                  <li>CAV</li>
                  <li>Authentication</li>
                  <li>Transfer Credential / Honorable Dismissal</li>
                  <li>Form 137</li>
                  <li>Certificate of Graduation</li>
                </ul>
              </div>
              <div className="mt-3">
                <button
                  onClick={handleRejectClick}
                  disabled={updating}
                  className="inline-flex items-center px-3 py-1.5 bg-red-600 text-white text-xs font-medium rounded-md hover:bg-red-700 disabled:opacity-50"
                >
                  <svg className="w-3 h-3 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                  Reject Request
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left Column - Student Information & Document Details */}
        <div className="lg:col-span-2 space-y-6">
          
          {/* Student Information */}
          <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">
            <div className="px-6 py-4 border-b border-gray-200 bg-gray-50">
              <h2 className="text-base font-semibold text-gray-900">Student Information</h2>
            </div>
            <div className="p-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {/* Queue Number - Now BEFORE Full Name */}
                <div>
                  <p className="text-xs text-gray-500 mb-1">Queue Number</p>
                  <p className="text-sm font-bold text-[#7A0019] text-lg">#{request.queue_number || '—'}</p>
                </div>
                <div>
                  <p className="text-xs text-gray-500 mb-1">Full Name</p>
                  <p className="text-sm font-medium text-gray-900">{request.studentName}</p>
                </div>
                <div>
                  <p className="text-xs text-gray-500 mb-1">Student ID</p>
                  <p className="text-sm font-medium text-gray-900">{request.studentId}</p>
                </div>
                <div>
                  <p className="text-xs text-gray-500 mb-1">Student Type</p>
                  <p className="text-sm font-medium">
                    <span className={`inline-flex px-2.5 py-1 text-xs font-medium rounded-full ${getUserTypeBadge(request.studentType)}`}>
                      {request.studentType}
                    </span>
                  </p>
                </div>
                <div>
                  <p className="text-xs text-gray-500 mb-1">
                    {request.studentType === 'Alumni' ? 'Year Graduated' : 'Year Level'}
                  </p>
                  <p className="text-sm text-gray-900">{getYearDisplay()}</p>
                </div>
                <div className="md:col-span-2">
                  <p className="text-xs text-gray-500 mb-1">Course</p>
                  <p className="text-sm font-medium text-gray-900">{request.course || 'N/A'}</p>
                </div>
                <div className="md:col-span-2">
                  <p className="text-xs text-gray-500 mb-1">Department/College</p>
                  <p className="text-sm text-gray-900">{request.department || 'N/A'}</p>
                </div>
                {/* Mobile Number - REMOVED */}
                <div>
                  <p className="text-xs text-gray-500 mb-1">Email Address</p>
                  <div className="flex items-center text-sm text-blue-600">
                    <svg className="w-4 h-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                    </svg>
                    <span className="font-medium">{request.email}</span>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Document Details */}
          <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">
            <div className="px-6 py-4 border-b border-gray-200 bg-gray-50">
              <h2 className="text-base font-semibold text-gray-900">Document Details</h2>
            </div>
            <div className="p-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="md:col-span-2">
                  <p className="text-xs text-gray-500 mb-1">Document Type</p>
                  <div className="flex items-center">
                    <p className="text-sm font-medium text-gray-900">{request.documentType}</p>
                    {isRestricted && (
                      <span className="ml-2 px-2 py-0.5 bg-red-100 text-red-800 text-xs font-medium rounded-full">
                        ❌ Restricted
                      </span>
                    )}
                  </div>
                </div>
                <div>
                  <p className="text-xs text-gray-500 mb-1">Number of Copies</p>
                  <p className="text-sm text-gray-900">{request.copies}</p>
                </div>
                <div className="md:col-span-2">
                  <p className="text-xs text-gray-500 mb-1">Purpose</p>
                  <p className="text-sm text-gray-900">{request.purpose}</p>
                </div>
                <div>
                  <p className="text-xs text-gray-500 mb-1">Request Date</p>
                  <p className="text-sm text-gray-900">{request.requestDate}</p>
                </div>
                <div>
                  <p className="text-xs text-gray-500 mb-1">Processing Time</p>
                  <p className="text-sm text-gray-900">{request.processingTime}</p>
                </div>
                <div>
                  <p className="text-xs text-gray-500 mb-1">Amount</p>
                  <p className="text-sm font-bold text-[#7A0019]">₱{request.amount}</p>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Right Column - Status Actions, Email Preview, Activity History */}
        <div className="space-y-6">
          
          {/* Status Actions */}
          <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">
            <div className="px-6 py-4 border-b border-gray-200 bg-gray-50">
              <h2 className="text-base font-semibold text-gray-900">Update Status</h2>
              <p className="text-xs text-gray-500 mt-1">Email will be sent automatically for Approve/Ready</p>
            </div>
            <div className="p-6 space-y-3">
              {isRestricted ? (
                <div className="bg-red-50 border border-red-200 rounded-md p-3 mb-3">
                  <p className="text-xs text-red-700 font-medium">
                    ⚠️ Cannot approve this request
                  </p>
                  <p className="text-xs text-red-600 mt-1">
                    {request.documentType} is not available for {request.studentType}.
                  </p>
                </div>
              ) : null}
              
              {/* 1. Approved and Processing */}
              <button
                onClick={() => handleStatusChange('approved')}
                disabled={status !== 'pending' || isRestricted || updating}
                className={`w-full flex items-center px-4 py-3 text-sm rounded-md transition-colors ${
                  status !== 'pending' || isRestricted || updating
                    ? 'bg-gray-100 text-gray-400 cursor-not-allowed'
                    : 'bg-blue-50 text-blue-700 hover:bg-blue-100 border border-blue-200'
                }`}
              >
                <span className="w-6 h-6 bg-blue-600 rounded-full flex items-center justify-center mr-3 text-white text-xs font-bold">
                  1
                </span>
                <div className="flex-1 text-left">
                  <p className="font-medium">✓ Approved and Processing</p>
                  <p className="text-xs opacity-75">Approve request & start processing</p>
                </div>
              </button>
              
              {/* 2. Ready for Pickup */}
              <button
                onClick={() => handleStatusChange('ready')}
                disabled={!(status === 'processing' || status === 'approved') || isRestricted || updating}
                className={`w-full flex items-center px-4 py-3 text-sm rounded-md transition-colors ${
                  !(status === 'processing' || status === 'approved') || isRestricted || updating
                    ? 'bg-gray-100 text-gray-400 cursor-not-allowed'
                    : 'bg-purple-50 text-purple-700 hover:bg-purple-100 border border-purple-200'
                }`}
              >
                <span className="w-6 h-6 bg-purple-600 rounded-full flex items-center justify-center mr-3 text-white text-xs font-bold">
                  2
                </span>
                <div className="flex-1 text-left">
                  <p className="font-medium">📦 Ready for Pickup</p>
                  <p className="text-xs opacity-75">Document is ready to be claimed</p>
                </div>
              </button>
              
              {/* 3. Mark as Claimed */}
              <button
                onClick={handleClaimClick}
                disabled={status !== 'ready' || isRestricted || updating}
                className={`w-full flex items-center px-4 py-3 text-sm rounded-md transition-colors ${
                  status !== 'ready' || isRestricted || updating
                    ? 'bg-gray-100 text-gray-400 cursor-not-allowed'
                    : 'bg-green-50 text-green-700 hover:bg-green-100 border border-green-200'
                }`}
              >
                <span className="w-6 h-6 bg-green-600 rounded-full flex items-center justify-center mr-3 text-white text-xs font-bold">
                  3
                </span>
                <div className="flex-1 text-left">
                  <p className="font-medium">✅ Mark as Claimed</p>
                  <p className="text-xs opacity-75">Document claimed (no notification sent)</p>
                </div>
              </button>
              
              {/* Divider */}
              <div className="relative py-2">
                <div className="absolute inset-0 flex items-center">
                  <div className="w-full border-t border-gray-200"></div>
                </div>
                <div className="relative flex justify-center">
                  <span className="bg-white px-2 text-xs text-gray-400">or</span>
                </div>
              </div>
              
              {/* 4. Reject Request */}
              <button
                onClick={handleRejectClick}
                disabled={status === 'claimed' || status === 'rejected' || updating}
                className={`w-full flex items-center px-4 py-3 text-sm rounded-md transition-colors ${
                  status === 'claimed' || status === 'rejected' || updating
                    ? 'bg-gray-100 text-gray-400 cursor-not-allowed'
                    : 'bg-red-50 text-red-700 hover:bg-red-100 border border-red-200'
                }`}
              >
                <span className="w-6 h-6 bg-red-600 rounded-full flex items-center justify-center mr-3 text-white text-xs font-bold">
                  ✕
                </span>
                <div className="flex-1 text-left">
                  <p className="font-medium">Reject Request</p>
                  <p className="text-xs opacity-75">Decline this request with reason</p>
                </div>
              </button>
            </div>
          </div>

          {/* Email Preview (removed SMS) */}
          <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">
            <div className="px-6 py-4 border-b border-gray-200 bg-gray-50">
              <h2 className="text-base font-semibold text-gray-900">Email Preview</h2>
            </div>
            <div className="p-6">
              <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                <div className="flex items-start">
                  <svg className="w-5 h-5 text-blue-500 mr-3 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                  </svg>
                  <div className="flex-1">
                    <div className="flex items-center gap-3 mb-2 text-xs">
                      <span className="font-medium text-blue-800">To Email: {request.email}</span>
                    </div>
                    <p className="text-sm text-gray-800 whitespace-pre-line">
                      {status === 'pending' && '⬆️ Select "Approved and Processing" to send notification'}
                      {status === 'approved' && !isRestricted && emailTemplates.approved
                        .replace('{REQ_ID}', request.id)
                        .replace('{DOCUMENT}', request.documentType)
                        .replace('{AMOUNT}', request.amount)
                        .replace('{PROCESSING_TIME}', request.processingTime)}
                      {status === 'processing' && !isRestricted && emailTemplates.approved
                        .replace('{REQ_ID}', request.id)
                        .replace('{DOCUMENT}', request.documentType)
                        .replace('{AMOUNT}', request.amount)
                        .replace('{PROCESSING_TIME}', request.processingTime)}
                      {status === 'ready' && !isRestricted && emailTemplates.ready
                        .replace('{DOCUMENT}', request.documentType)
                        .replace('{AMOUNT}', request.amount)}
                      {status === 'rejected' && '❌ Request rejected - Reason will be included in notification'}
                      {status === 'claimed' && '✅ Document claimed - No notification sent'}
                      {isRestricted && '⚠️ Cannot send notifications for restricted document.'}
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Activity History */}
          <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">
            <div className="px-6 py-4 border-b border-gray-200 bg-gray-50">
              <h2 className="text-base font-semibold text-gray-900">Activity History</h2>
            </div>
            <div className="p-6">
              <div className="space-y-4">
                {request.history && request.history.length > 0 ? (
                  request.history.map((item, index) => (
                    <div key={index} className="relative pl-5 pb-4 last:pb-0">
                      {index !== request.history.length - 1 && (
                        <div className="absolute left-[7px] top-2 bottom-0 w-0.5 bg-gray-200"></div>
                      )}
                      <div className="absolute left-0 top-1.5 w-2.5 h-2.5 bg-maroon-500 rounded-full"></div>
                      <div>
                        <p className="text-sm font-medium text-gray-900">{item.action || item.status}</p>
                        <p className="text-xs text-gray-500 mt-0.5">
                          {item.timestamp ? new Date(item.timestamp).toLocaleString() : item.date}
                        </p>
                        <p className="text-[10px] text-gray-400 mt-0.5">By: {item.user || item.admin_name || 'System'}</p>
                        {item.reason && (
                          <p className="text-xs text-red-600 mt-1">Reason: {item.reason}</p>
                        )}
                      </div>
                    </div>
                  ))
                ) : (
                  <div className="text-center py-4">
                    <p className="text-sm text-gray-500">No activity history yet</p>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Confirmation Modal for Approve/Ready */}
      <ConfirmationModal
        isOpen={showStatusModal}
        onClose={() => setShowStatusModal(false)}
        onConfirm={confirmStatusChange}
        title={selectedStatus === 'approved' ? 'Approve and Process Request' : 'Mark as Ready for Pickup'}
        message={
          <div className="space-y-3">
            <p>
              {selectedStatus === 'approved' 
                ? 'Are you sure you want to approve this request and start processing?' 
                : 'Are you sure you want to mark this document as ready for pickup?'}
            </p>
            {!isRestricted && (
              <div className="bg-yellow-50 border border-yellow-200 rounded-md p-3">
                <p className="text-xs font-medium text-yellow-800 mb-2">📧 Notification will be sent to:</p>
                <div className="space-y-1">
                  <p className="text-xs text-gray-700">Email: {request.email}</p>
                </div>
                <div className="mt-2 pt-2 border-t border-yellow-200">
                  <p className="text-xs font-medium text-yellow-800 mb-1">Message preview:</p>
                  <p className="text-xs text-gray-700 whitespace-pre-line">{emailMessage}</p>
                </div>
              </div>
            )}
          </div>
        }
        confirmText={selectedStatus === 'approved' ? 'Yes, Approve & Process' : 'Yes, Mark as Ready'}
        confirmColor={selectedStatus === 'approved' ? 'bg-green-600 hover:bg-green-700' : 'bg-purple-600 hover:bg-purple-700'}
        loading={updating}
      />

      {/* Claim Modal - NO NOTIFICATION */}
      <ConfirmationModal
        isOpen={showClaimModal}
        onClose={() => setShowClaimModal(false)}
        onConfirm={confirmClaim}
        title="Mark as Claimed"
        message={
          <div className="space-y-3">
            <p className="text-sm text-gray-700">
              Are you sure you want to mark this document as <span className="font-bold">CLAIMED</span> by the student?
            </p>
            <div className="bg-blue-50 border border-blue-200 rounded-md p-3">
              <p className="text-xs text-blue-800">
                <span className="font-bold">ℹ️ Note:</span> No email notification will be sent for claimed status. This is for internal tracking only.
              </p>
            </div>
            <div className="bg-yellow-50 border border-yellow-200 rounded-md p-3">
              <p className="text-xs font-medium text-yellow-800 mb-1">Document details:</p>
              <p className="text-xs text-gray-700">{request.documentType} - {request.copies} copy/copies</p>
            </div>
          </div>
        }
        confirmText="Yes, Mark as Claimed"
        confirmColor="bg-green-600 hover:bg-green-700"
        loading={updating}
      />

      {/* Reject Modal with Reason */}
      <ConfirmationModal
        isOpen={showRejectModal}
        onClose={() => {
          setShowRejectModal(false);
          setRejectReason('');
        }}
        onConfirm={confirmReject}
        title="Reject Request"
        message={
          <div className="space-y-4">
            <p className="text-sm text-gray-700">
              Please provide a reason for rejecting this request. This will be included in the email notification.
            </p>
            <div>
              <label className="block text-xs font-medium text-gray-700 mb-2">
                Rejection Reason <span className="text-red-500">*</span>
              </label>
              <textarea
                value={rejectReason}
                onChange={(e) => setRejectReason(e.target.value)}
                placeholder="e.g., Incomplete requirements, Invalid document request, etc."
                rows="4"
                className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-1 focus:ring-red-500 focus:border-red-500"
                autoFocus
                disabled={updating}
              />
            </div>
            <div className="bg-yellow-50 border border-yellow-200 rounded-md p-3">
              <p className="text-xs font-medium text-yellow-800 mb-2">📧 Notification will be sent to:</p>
              <div className="space-y-1">
                <p className="text-xs text-gray-700">Email: {request.email}</p>
              </div>
              {rejectReason && (
                <div className="mt-2 pt-2 border-t border-yellow-200">
                  <p className="text-xs font-medium text-yellow-800 mb-1">Message preview:</p>
                  <p className="text-xs text-gray-700 whitespace-pre-line">
                    {emailTemplates.rejected
                      .replace('{REQ_ID}', request.id)
                      .replace('{DOCUMENT}', request.documentType)
                      .replace('{REASON}', rejectReason)}
                  </p>
                </div>
              )}
            </div>
          </div>
        }
        confirmText="Reject Request"
        confirmColor="bg-red-600 hover:bg-red-700"
        loading={updating}
      />
    </div>
  );
};

export default RequestDetails;
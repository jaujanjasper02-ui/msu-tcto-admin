import React, { useState, useEffect, useCallback } from 'react';
import { Link } from 'react-router-dom';
import { 
  FaSearch, 
  FaTimes, 
  FaEye, 
  FaChevronLeft, 
  FaChevronRight,
  FaRegClock,
  FaExclamationTriangle,
  FaFileAlt,
  FaUserGraduate,
  FaUserTie,
  FaSpinner,
  FaCheckCircle,
  FaBoxOpen,
  FaCheck,
  FaTimes as FaTimesIcon,
  FaLock
} from 'react-icons/fa';

// ============================================
// STATUS BADGE COMPONENT
// ============================================
const StatusBadge = ({ status }) => {
  const config = {
    'pending': { bg: 'bg-amber-100', text: 'text-amber-700', icon: <FaRegClock className="w-3 h-3" />, label: 'Pending' },
    'approved': { bg: 'bg-emerald-100', text: 'text-emerald-700', icon: <FaCheckCircle className="w-3 h-3" />, label: 'Approved' },
    'processing': { bg: 'bg-sky-100', text: 'text-sky-700', icon: <FaSpinner className="w-3 h-3" />, label: 'Processing' },
    'ready': { bg: 'bg-purple-100', text: 'text-purple-700', icon: <FaBoxOpen className="w-3 h-3" />, label: 'Ready' },
    'claimed': { bg: 'bg-indigo-100', text: 'text-indigo-700', icon: <FaCheck className="w-3 h-3" />, label: 'Claimed' },
    'rejected': { bg: 'bg-rose-100', text: 'text-rose-700', icon: <FaTimesIcon className="w-3 h-3" />, label: 'Rejected' }
  };
  const c = config[status] || { bg: 'bg-gray-100', text: 'text-gray-700', icon: <FaFileAlt className="w-3 h-3" />, label: status };
  return (
    <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 text-xs font-semibold rounded-lg ${c.bg} ${c.text}`}>
      {c.icon}
      {c.label}
    </span>
  );
};

// ============================================
// HELPER: GET DEPARTMENT STYLES
// ============================================
const getDepartmentStyles = (department) => {
  const styles = {
    'CCS': { bg: 'bg-blue-100', text: 'text-blue-700', label: 'CCS' },
    'COED': { bg: 'bg-green-100', text: 'text-green-700', label: 'COED' },
    'CAS': { bg: 'bg-yellow-100', text: 'text-yellow-700', label: 'CAS' },
    'COF': { bg: 'bg-cyan-100', text: 'text-cyan-700', label: 'COF' },
    'CIAS': { bg: 'bg-emerald-100', text: 'text-emerald-700', label: 'CIAS' },
    'IOES': { bg: 'bg-teal-100', text: 'text-teal-700', label: 'IOES' }
  };
  return styles[department] || { bg: 'bg-gray-100', text: 'text-gray-700', label: department };
};

const getDepartmentDisplay = (dept) => {
  const deptNames = {
    'CCS': 'College of Computer Studies (CCS)',
    'COED': 'College of Education (COED)',
    'CAS': 'College of Arts and Sciences (CAS)',
    'COF': 'College of Fisheries (COF)',
    'CIAS': 'College of Islamic and Arabic Studies (CIAS)',
    'IOES': 'Institute of Oceanography (IOES)'
  };
  return deptNames[dept] || dept;
};

// ============================================
// MAIN REQUESTS COMPONENT
// ============================================
const Requests = () => {
  const [filter, setFilter] = useState('all');
  const [searchTerm, setSearchTerm] = useState('');
  const [requests, setRequests] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [pagination, setPagination] = useState({
    page: 1,
    limit: 10,
    total: 0,
    pages: 0
  });

  const [currentUser, setCurrentUser] = useState({
    role: 'staff',
    department: 'CCS'
  });

  const [isSearching, setIsSearching] = useState(false);
  const [nextInLineQueue, setNextInLineQueue] = useState(null);
  const [actionLoading, setActionLoading] = useState(null);
  const [showConfirmModal, setShowConfirmModal] = useState(false);
  const [selectedRequest, setSelectedRequest] = useState(null);
  const [selectedAction, setSelectedAction] = useState(null);
  const [rejectionReason, setRejectionReason] = useState('');
  const [toast, setToast] = useState({ show: false, message: '', type: '' });

  const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000/api';

  useEffect(() => {
    const userData = localStorage.getItem('currentUser');
    if (userData) {
      try {
        const parsed = JSON.parse(userData);
        const user = parsed.user || parsed;
        setCurrentUser({
          role: user.role || 'staff',
          department: user.department || 'CCS'
        });
      } catch (err) {
        console.error('Error parsing user:', err);
      }
    }
  }, []);

  const showToast = (message, type = 'success') => {
    setToast({ show: true, message, type });
    setTimeout(() => setToast({ show: false, message: '', type: '' }), 3000);
  };

  const fetchNextInLine = useCallback(async () => {
    try {
      const token = localStorage.getItem('authToken');
      if (!token) return;
      
      const response = await fetch(`${API_BASE_URL}/requests/next-in-line`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      
      if (response.ok) {
        const data = await response.json();
        setNextInLineQueue(data.nextRequest?.queue_number || null);
      }
    } catch (err) {
      console.error('Failed to fetch next in line:', err);
    }
  }, [API_BASE_URL]);

  const canProcessRequest = useCallback((request) => {
  // ✅ Claimed or rejected - hindi na pwedeng i-process
  if (request.status === 'claimed' || request.status === 'rejected') {
    return false;
  }
  
  // ✅ Only pending, approved, processing ang pwedeng i-process
  const activeStatuses = ['pending', 'approved', 'processing'];
  if (!activeStatuses.includes(request.status)) {
    return false;
  }
  
  // ✅ Kung walang next in line, puwede (first request)
  if (!nextInLineQueue) return true;
  
  // ✅ Dapat match ang queue number sa next in line
  return request.queue_number === nextInLineQueue;
}, [nextInLineQueue]);

  const getAvailableActions = useCallback((status, canProcess) => {
  // ✅ Claimed or rejected - walang actions
  if (status === 'claimed' || status === 'rejected') {
    return [];
  }
  
  // ✅ Locked - walang actions (hindi lang "Locked" button)
  if (!canProcess && (status === 'pending' || status === 'approved' || status === 'processing')) {
    return [];  // Empty array = walang buttons
  }
  
  const actions = [];
  
  switch(status) {
    case 'pending':
      actions.push({ action: 'approved', label: 'Approve', icon: <FaCheck className="w-3 h-3" /> });
      actions.push({ action: 'rejected', label: 'Reject', icon: <FaTimesIcon className="w-3 h-3" /> });
      break;
    case 'approved':
      actions.push({ action: 'processing', label: 'Process', icon: <FaSpinner className="w-3 h-3" /> });
      actions.push({ action: 'rejected', label: 'Reject', icon: <FaTimesIcon className="w-3 h-3" /> });
      break;
    case 'processing':
      actions.push({ action: 'ready', label: 'Ready', icon: <FaBoxOpen className="w-3 h-3" /> });
      actions.push({ action: 'rejected', label: 'Reject', icon: <FaTimesIcon className="w-3 h-3" /> });
      break;
    case 'ready':
      actions.push({ action: 'claimed', label: 'Claim', icon: <FaCheck className="w-3 h-3" /> });
      break;
    default: break;
  }
  return actions;
}, []);

  const openConfirmModal = (request, action) => {
    setSelectedRequest(request);
    setSelectedAction(action);
    setRejectionReason('');
    setShowConfirmModal(true);
  };

  const handleStatusUpdate = async () => {
    if (!selectedRequest || !selectedAction) return;
    setActionLoading(selectedRequest.id);
    
    try {
      const token = localStorage.getItem('authToken');
      const payload = { status: selectedAction };
      if (selectedAction === 'rejected' && rejectionReason) payload.reason = rejectionReason;
      
      const response = await fetch(`${API_BASE_URL}/requests/update-status/${selectedRequest.id}`, {
        method: 'PUT',
        headers: { 'Authorization': `Bearer ${token}`, 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });
      
      const data = await response.json();
      if (!response.ok) throw new Error(data.message);
      
      showToast(`Request ${data.message || 'updated'}`, 'success');
      fetchRequests();
      fetchNextInLine();
    } catch (err) {
      showToast(err.message, 'error');
    } finally {
      setActionLoading(null);
      setShowConfirmModal(false);
      setSelectedRequest(null);
      setSelectedAction(null);
      setRejectionReason('');
    }
  };

  const fetchRequests = useCallback(async () => {
    setLoading(true);
    setError(null);
    
    try {
      const token = localStorage.getItem('authToken');
      if (!token) throw new Error('Not authenticated');

      const params = new URLSearchParams({
        page: pagination.page,
        limit: pagination.limit,
        ...(filter !== 'all' && { status: filter })
      });

      const response = await fetch(`${API_BASE_URL}/requests/getrequest?${params}`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });

      const data = await response.json();
      if (!response.ok) throw new Error(data.message);

      setRequests(data.requests || []);
      setPagination(data.pagination || pagination);
      await fetchNextInLine();
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }, [pagination.page, pagination.limit, filter, API_BASE_URL, fetchNextInLine]);

  const searchRequests = useCallback(async (query) => {
    if (!query.trim()) { fetchRequests(); return; }
    
    setLoading(true);
    setIsSearching(true);
    try {
      const token = localStorage.getItem('authToken');
      const response = await fetch(`${API_BASE_URL}/requests/search?q=${encodeURIComponent(query)}&page=${pagination.page}&limit=${pagination.limit}`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      
      const data = await response.json();
      if (!response.ok) throw new Error(data.message);
      
      setRequests(data.results || []);
      setPagination(prev => ({ ...prev, total: data.total || 0, pages: Math.ceil((data.total || 0) / prev.limit) }));
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }, [pagination.page, pagination.limit, API_BASE_URL, fetchRequests]);

  useEffect(() => {
    if (!isSearching) fetchRequests();
  }, [filter, pagination.page, pagination.limit, fetchRequests, isSearching]);

  useEffect(() => {
    const timer = setTimeout(() => {
      if (searchTerm) {
        setPagination(prev => ({ ...prev, page: 1 }));
        searchRequests(searchTerm);
      } else {
        setIsSearching(false);
        fetchRequests();
      }
    }, 500);
    return () => clearTimeout(timer);
  }, [searchTerm, searchRequests, fetchRequests]);

  const clearSearch = () => {
    setSearchTerm('');
    setIsSearching(false);
    setPagination(prev => ({ ...prev, page: 1 }));
    fetchRequests();
  };

  const getUserTypeBadge = (type) => {
    if (type?.toLowerCase() === 'student') {
      return <span className="inline-flex items-center gap-1 px-2 py-0.5 text-xs font-medium bg-sky-100 text-sky-700 rounded-lg"><FaUserGraduate className="w-3 h-3" /> Student</span>;
    }
    return <span className="inline-flex items-center gap-1 px-2 py-0.5 text-xs font-medium bg-purple-100 text-purple-700 rounded-lg"><FaUserTie className="w-3 h-3" /> Alumni</span>;
  };

  const isRestrictedDocument = (doc, studentType) => {
    if (studentType?.toLowerCase() !== 'student') return false;
    const restrictedDocs = ['TOR', 'Diploma', 'CAV', 'Authentication', 'Transfer Credential', 'Form 137', 'Certificate of Graduation'];
    return restrictedDocs.some(rd => doc?.includes(rd));
  };

  const handlePageChange = (newPage) => {
    if (newPage >= 1 && newPage <= pagination.pages) {
      setPagination(prev => ({ ...prev, page: newPage }));
    }
  };

  const handleFilterChange = (newFilter) => {
    setFilter(newFilter);
    setPagination(prev => ({ ...prev, page: 1 }));
    if (isSearching) { setSearchTerm(''); setIsSearching(false); }
  };

  const formatDisplayDate = (dateString) => {
    if (!dateString) return '—';
    return new Date(dateString).toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: 'numeric' });
  };

  // Calculate colspan based on user role
  const colSpan = currentUser.role === 'super_admin' ? 9 : 8;

  if (loading && requests.length === 0) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="w-8 h-8 border-2 border-[#7A0019] border-t-transparent rounded-full animate-spin mx-auto"></div>
          <p className="text-gray-500 text-sm mt-3">Loading requests...</p>
        </div>
      </div>
    );
  }

  if (error && requests.length === 0) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
        <div className="bg-white rounded-xl p-6 text-center max-w-md">
          <FaExclamationTriangle className="text-red-500 text-3xl mx-auto mb-3" />
          <p className="text-gray-600 mb-4">{error}</p>
          <button onClick={fetchRequests} className="px-4 py-2 bg-[#7A0019] text-white rounded-lg text-sm">Try Again</button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-[1400px] mx-auto px-4 py-6">
        
        {/* Toast Notification */}
        {toast.show && (
          <div className={`fixed top-20 right-6 z-50 px-4 py-2 rounded-lg shadow-lg ${toast.type === 'success' ? 'bg-green-500 text-white' : 'bg-red-500 text-white'}`}>
            <span className="text-sm">{toast.message}</span>
          </div>
        )}

        {/* ========== HEADER ========== */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
          <div>
            <h1 className="text-2xl font-bold text-gray-800">Document Requests</h1>
            <p className="text-sm text-gray-500 mt-0.5">Manage and track all student document requests</p>
          </div>
          <button onClick={fetchRequests} className="px-4 py-2 bg-[#7A0019] text-white text-sm font-medium rounded-lg hover:bg-[#5a0012] transition">
            Refresh
          </button>
        </div>

        {/* ========== STAFF DEPARTMENT BANNER ========== */}
        {currentUser.role !== 'super_admin' && (
          <div className="mb-5 bg-blue-50 border border-blue-200 rounded-lg p-3">
            <p className="text-sm text-blue-700">
              📁 You are managing: <strong>{getDepartmentDisplay(currentUser.department)}</strong> Department
            </p>
            <p className="text-xs text-blue-600 mt-0.5">
              You can only see and process requests from this department.
            </p>
          </div>
        )}

        {/* ========== FIFO INFO BANNER ========== */}
        <div className="mb-5 bg-amber-50 rounded-lg p-3 border border-amber-200">
          <div className="flex items-center gap-2">
            <FaRegClock className="text-amber-600 text-sm" />
            <p className="text-sm text-amber-800">
              <strong>FIFO Queue:</strong> Requests must be processed in order.
              {nextInLineQueue ? (
                <span className="ml-1">Queue <strong className="bg-emerald-100 px-1.5 py-0.5 rounded">#{nextInLineQueue}</strong> is next in line.</span>
              ) : ' No pending requests.'}
            </p>
          </div>
        </div>

        {/* ========== FILTER BUTTONS ========== */}
        <div className="flex flex-wrap gap-2 mb-4">
          {['all', 'pending', 'processing', 'ready', 'claimed', 'rejected'].map((status) => (
            <button
              key={status}
              onClick={() => handleFilterChange(status)}
              className={`px-3 py-1.5 text-sm font-medium rounded-lg transition ${
                filter === status
                  ? status === 'all' ? 'bg-[#7A0019] text-white' :
                    status === 'pending' ? 'bg-amber-500 text-white' :
                    status === 'processing' ? 'bg-sky-500 text-white' :
                    status === 'ready' ? 'bg-purple-500 text-white' :
                    status === 'claimed' ? 'bg-emerald-500 text-white' :
                    'bg-rose-500 text-white'
                  : 'bg-white text-gray-600 border border-gray-200 hover:bg-gray-50'
              }`}
            >
              {status === 'all' ? 'All' : status.charAt(0).toUpperCase() + status.slice(1)}
            </button>
          ))}
        </div>

        {/* ========== SEARCH BAR ========== */}
        <div className="mb-5">
          <div className="relative">
            <FaSearch className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 text-sm" />
            <input
              type="text"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder="Search by name, ID number, or document type..."
              className="w-full pl-9 pr-9 py-2 bg-white border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-[#7A0019]/20 focus:border-[#7A0019]"
            />
            {searchTerm && (
              <button onClick={clearSearch} className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600">
                <FaTimes className="w-4 h-4" />
              </button>
            )}
          </div>
        </div>

        {/* ========== REQUESTS TABLE ========== */}
        <div className="bg-white rounded-lg border border-gray-200 overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="bg-gray-50 border-b border-gray-200">
                  <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500">Queue</th>
                  <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500">Request ID</th>
                  {currentUser.role === 'super_admin' && (
                    <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500">Department</th>
                  )}
                  <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500">Student</th>
                  <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500">Type</th>
                  <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500">Document</th>
                  <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500">Date</th>
                  <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500">Status</th>
                  <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500">Actions</th>
                </tr>
              </thead>
              <tbody>
                {requests.length === 0 ? (
                  <tr>
                    <td colSpan={colSpan} className="px-4 py-12 text-center">
                      <FaFileAlt className="text-gray-300 text-3xl mx-auto mb-2" />
                      <p className="text-gray-500">No requests found</p>
                    </td>
                  </tr>
                ) : (
                  requests.map((request) => {
                    const restricted = isRestrictedDocument(request.document, request.studentType);
                    const canProcess = canProcessRequest(request);
                    const isNextInLine = nextInLineQueue === request.queue_number && 
                     (request.status === 'pending' || request.status === 'approved' || request.status === 'processing');
                    const isBlocked = !canProcess && (request.status === 'pending' || request.status === 'approved' || request.status === 'processing');
                    const actions = getAvailableActions(request.status, canProcess);
                    const deptStyles = getDepartmentStyles(request.department);
                    
                    return (
                      <tr key={request.id} className={`border-b border-gray-100 hover:bg-gray-50 ${restricted ? 'bg-rose-50/30' : ''}`}>
                        <td className="px-4 py-3">
                          <div className="flex items-center gap-2">
                            <span className={`inline-flex items-center justify-center w-8 h-8 rounded-lg text-sm font-bold ${
                              isNextInLine ? 'bg-emerald-500 text-white' :
                              isBlocked ? 'bg-gray-200 text-gray-400' : 'bg-gray-100 text-gray-700'
                            }`}>#{request.queue_number}</span>
                            {isBlocked && <span className="text-xs text-gray-400">Locked</span>}
                            {isNextInLine && <span className="text-xs bg-emerald-100 text-emerald-700 px-1.5 py-0.5 rounded">Next</span>}
                          </div>
                        </td>
                        <td className="px-4 py-3"><span className="text-sm font-mono text-[#7A0019]">{request.id}</span></td>
                        {currentUser.role === 'super_admin' && (
                          <td className="px-4 py-3">
                            <span className={`px-2 py-1 text-xs font-medium rounded-full ${deptStyles.bg} ${deptStyles.text}`}>
                              {deptStyles.label}
                            </span>
                          </td>
                        )}
                        <td className="px-4 py-3">
                          <div className="text-sm font-medium text-gray-800">{request.student}</div>
                          <div className="text-xs text-gray-400">Copies: {request.copies}</div>
                        </td>
                        <td className="px-4 py-3">{getUserTypeBadge(request.studentType)}</td>
                        <td className="px-4 py-3">
                          <div className="text-sm text-gray-800">{request.document}</div>
                          {restricted && <div className="text-xs text-rose-500">Restricted for students</div>}
                        </td>
                        <td className="px-4 py-3 text-sm text-gray-500">{formatDisplayDate(request.date)}</td>
                        <td className="px-4 py-3"><StatusBadge status={request.status} /></td>
                        <td className="px-4 py-3">
                          <div className="flex items-center gap-2">
                            <Link to={`/admin/requests/${request.id}`} className="p-1.5 text-gray-400 hover:text-[#7A0019] rounded-lg">
                              <FaEye className="w-4 h-4" />
                            </Link>
                            {actions.map((action) => (
                              <button
                                key={action.action}
                                onClick={() => openConfirmModal(request, action.action)}
                                disabled={action.disabled || actionLoading === request.id}
                                className={`px-2 py-1 text-xs font-medium rounded-lg flex items-center gap-1 ${
                                  action.action === 'approved' ? 'bg-emerald-100 text-emerald-700' :
                                  action.action === 'processing' ? 'bg-sky-100 text-sky-700' :
                                  action.action === 'ready' ? 'bg-purple-100 text-purple-700' :
                                  action.action === 'claimed' ? 'bg-indigo-100 text-indigo-700' :
                                  action.action === 'rejected' ? 'bg-rose-100 text-rose-700' :
                                  'bg-gray-100 text-gray-400'
                                }`}
                              >
                                {action.icon} {action.label}
                              </button>
                            ))}
                          </div>
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>

          {/* Pagination */}
          {pagination.total > 0 && (
            <div className="px-4 py-3 border-t border-gray-100 flex flex-col sm:flex-row justify-between items-center gap-3">
              <span className="text-sm text-gray-500">
                {((pagination.page - 1) * pagination.limit) + 1} - {Math.min(pagination.page * pagination.limit, pagination.total)} of {pagination.total}
              </span>
              <div className="flex gap-2">
                <button onClick={() => handlePageChange(pagination.page - 1)} disabled={pagination.page === 1} className="px-3 py-1 border rounded-lg disabled:opacity-40">
                  <FaChevronLeft className="w-3 h-3" />
                </button>
                <span className="px-3 py-1 bg-[#7A0019] text-white rounded-lg text-sm">{pagination.page}</span>
                <button onClick={() => handlePageChange(pagination.page + 1)} disabled={pagination.page === pagination.pages} className="px-3 py-1 border rounded-lg disabled:opacity-40">
                  <FaChevronRight className="w-3 h-3" />
                </button>
              </div>
            </div>
          )}
        </div>

        {/* Restricted Documents Notice */}
        <div className="mt-5 bg-amber-50 rounded-lg p-3 border border-amber-200">
          <p className="text-xs text-amber-700">
            <strong>Note:</strong> TOR, Diploma, CAV, Authentication are NOT AVAILABLE for current students. Only Alumni can request these documents.
          </p>
        </div>

        {/* Confirmation Modal */}
        {showConfirmModal && selectedRequest && (
          <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50" onClick={() => setShowConfirmModal(false)}>
            <div className="bg-white rounded-lg max-w-md w-full p-5" onClick={(e) => e.stopPropagation()}>
              <h3 className="text-lg font-semibold mb-2">Confirm {selectedAction}</h3>
              <p className="text-gray-600 mb-4">
                Mark request <strong>{selectedRequest.id}</strong> as <strong>{selectedAction}</strong>?
              </p>
              {selectedAction === 'rejected' && (
                <textarea 
                  value={rejectionReason} 
                  onChange={(e) => setRejectionReason(e.target.value)} 
                  placeholder="Reason for rejection..."
                  className="w-full p-2 border rounded-lg mb-4 text-sm"
                  rows="3"
                />
              )}
              <div className="flex justify-end gap-3">
                <button onClick={() => setShowConfirmModal(false)} className="px-4 py-2 bg-gray-100 rounded-lg text-sm">Cancel</button>
                <button onClick={handleStatusUpdate} className="px-4 py-2 bg-[#7A0019] text-white rounded-lg text-sm">Confirm</button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default Requests;
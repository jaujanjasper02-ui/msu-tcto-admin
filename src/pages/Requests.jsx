import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { useNavigate, useLocation, Link } from 'react-router-dom';
import { 
  FaSearch, 
  FaTimes, 
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
  FaLock,
  FaCalendarDay,
  FaExclamationCircle,
  FaRegFileAlt,
  FaSearchPlus
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
// CUSTOM VIEW DETAILS ICON COMPONENT
// ============================================
const ViewDetailsIcon = ({ className = "w-4 h-4" }) => {
  return (
    <svg 
      className={className} 
      fill="none" 
      stroke="currentColor" 
      viewBox="0 0 24 24" 
      xmlns="http://www.w3.org/2000/svg"
    >
      <path 
        strokeLinecap="round" 
        strokeLinejoin="round" 
        strokeWidth={2} 
        d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" 
      />
      <path 
        strokeLinecap="round" 
        strokeLinejoin="round" 
        strokeWidth={2} 
        d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" 
      />
      <path 
        strokeLinecap="round" 
        strokeLinejoin="round" 
        strokeWidth={2} 
        d="M17.5 17.5L21 21" 
      />
    </svg>
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
// HELPER: GET LOCAL DATE STRING (YYYY-MM-DD)
// ============================================
const getLocalDateString = (date) => {
  const d = new Date(date);
  const year = d.getFullYear();
  const month = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
};

// ============================================
// MAIN REQUESTS COMPONENT
// ============================================
const Requests = () => {
  const navigate = useNavigate();
  const location = useLocation();
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
  const [toast, setToast] = useState({ show: false, message: '', type: '' });
  const [dailyLimit, setDailyLimit] = useState(100);

  const API_BASE_URL = import.meta.env.VITE_API_URL || 'https://msu-tcto-backend-oh2j.onrender.com/api';

  // Local today and yesterday
  const todayLocal = useMemo(() => getLocalDateString(new Date()), []);
  const yesterdayLocal = useMemo(() => {
    const yesterday = new Date();
    yesterday.setDate(yesterday.getDate() - 1);
    return getLocalDateString(yesterday);
  }, []);

  // 🆕 READ URL PARAMETERS (from Dashboard clicks)
  useEffect(() => {
    const params = new URLSearchParams(location.search);
    const statusParam = params.get('status');
    const searchParam = params.get('search');
    const dateParam = params.get('date');
    
    if (statusParam && ['pending', 'processing', 'ready', 'claimed', 'rejected'].includes(statusParam)) {
      setFilter(statusParam);
      // Clear search term when filtering by status
      if (searchTerm) setSearchTerm('');
    }
    
    if (searchParam) {
      setSearchTerm(searchParam);
      // Clear filter when searching
      if (filter !== 'all') setFilter('all');
    }
    
    if (dateParam) {
      // Optional: handle date filtering
      console.log('Date filter:', dateParam);
    }
  }, [location.search]);

  // Load user and daily limit
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
    fetchDailyLimit();
  }, []);

  const fetchDailyLimit = async () => {
    try {
      const token = localStorage.getItem('authToken');
      if (!token) return;
      const response = await fetch(`${API_BASE_URL}/admin/settings`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      if (response.ok) {
        const data = await response.json();
        setDailyLimit(data.settings?.daily_queue_limit || 100);
      }
    } catch (err) {
      console.error('Failed to load daily limit', err);
    }
  };

  const showToast = (message, type = 'success') => {
    setToast({ show: true, message, type });
    setTimeout(() => setToast({ show: false, message: '', type: '' }), 3000);
  };

  // ============================
  // DATA PROCESSING (daily queue, overflow, FIFO)
  // ============================
  const processedRequests = useMemo(() => {
    if (!requests.length) return [];

    // Sort by date ascending, then by queue_number
    const sorted = [...requests].sort((a, b) => {
      const dateA = getLocalDateString(a.date);
      const dateB = getLocalDateString(b.date);
      if (dateA !== dateB) return dateA.localeCompare(dateB);
      return a.queue_number - b.queue_number;
    });

    // Determine overflow for today
    const enriched = sorted.map(r => {
      const dateKey = getLocalDateString(r.date);
      const isToday = dateKey === todayLocal;
      let isOverflow = false;
      if (isToday) {
        const dayRequests = sorted.filter(x => getLocalDateString(x.date) === todayLocal);
        const index = dayRequests.findIndex(x => x.id === r.id);
        isOverflow = index >= dailyLimit;
      }
      return { ...r, displayDate: dateKey, isOverflow };
    });
    return enriched;
  }, [requests, dailyLimit, todayLocal]);

  // Earliest active date among pending/approved/processing
  const earliestActiveDate = useMemo(() => {
    const activeDates = processedRequests
      .filter(r => ['pending','approved','processing'].includes(r.status))
      .map(r => r.displayDate)
      .sort();
    return activeDates[0] || null;
  }, [processedRequests]);

  // Next in line: smallest queue_number on earliest active date
  const computedNextInLine = useMemo(() => {
    if (!earliestActiveDate) return null;
    const candidates = processedRequests
      .filter(r => ['pending','approved','processing'].includes(r.status) && r.displayDate === earliestActiveDate)
      .sort((a,b) => a.queue_number - b.queue_number);
    return candidates[0]?.queue_number || null;
  }, [processedRequests, earliestActiveDate]);

  // Now Serving: first request with "processing" status (auto-detect)
  const displayNowServing = useMemo(() => {
    const processing = processedRequests.find(r => r.status === 'processing');
    return processing?.queue_number || null;
  }, [processedRequests]);

  // Check if a specific request can be processed (FIFO)
  const canProcessRequest = useCallback((request) => {
    if (['claimed','rejected'].includes(request.status)) return false;
    if (!['pending','approved','processing'].includes(request.status)) return false;
    if (request.displayDate !== earliestActiveDate) return false;
    return request.queue_number === computedNextInLine;
  }, [earliestActiveDate, computedNextInLine]);

  // ============================
  // FETCHING
  // ============================
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
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }, [pagination.page, pagination.limit, filter, API_BASE_URL]);

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
    // Update URL without reloading the page
    navigate(`/admin/requests?status=${newFilter === 'all' ? '' : newFilter}`, { replace: true });
  };

  // Handle row click to navigate to details
  const handleRowClick = (requestId, isBlocked) => {
    if (!isBlocked) {
      navigate(`/admin/requests/${requestId}`);
    }
  };

  // Format display date using LOCAL dates
  const formatDisplayDate = (dateString, displayDate) => {
    if (!dateString) return '—';
    if (displayDate === todayLocal) return 'Today';
    if (displayDate === yesterdayLocal) return 'Yesterday';
    return new Date(dateString).toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
  };

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

  // Format earliest active date for display in banner
  const earliestActiveDateDisplay = earliestActiveDate
    ? (earliestActiveDate === todayLocal ? 'Today' : new Date(earliestActiveDate).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }))
    : null;

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-[1400px] mx-auto px-4 py-6">
        
        {/* Toast */}
        {toast.show && (
          <div className={`fixed top-20 right-6 z-50 px-4 py-2 rounded-lg shadow-lg ${toast.type === 'success' ? 'bg-green-500 text-white' : 'bg-red-500 text-white'}`}>
            <span className="text-sm">{toast.message}</span>
          </div>
        )}

        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
          <div>
            <h1 className="text-2xl font-bold text-[#5F0231]">Document Requests</h1>
            <p className="text-sm text-gray-500 mt-0.5">Manage and track all student document requests</p>
          </div>
          <button onClick={fetchRequests} className="px-4 py-2 bg-[#7A0019] text-white text-sm font-medium rounded-lg hover:bg-[#5a0012] transition">
            Refresh
          </button>
        </div>

        {/* Now Serving & Queue Info */}
        <div className="mb-5 bg-amber-50 rounded-lg p-3 border border-amber-200">
          <div className="flex items-center gap-2">
            <FaRegClock className="text-amber-600 text-sm" />
            <p className="text-sm text-amber-800">
              <strong>Now Serving:</strong> {displayNowServing ? (
                <span className="ml-1 bg-emerald-100 text-emerald-800 px-2 py-0.5 rounded font-bold">#{displayNowServing}</span>
              ) : <span className="text-gray-500">None</span>}
            </p>
          </div>
          <div className="mt-2 text-xs text-amber-700">
            {earliestActiveDate ? (
              <>Active requests from: <strong>{earliestActiveDateDisplay}</strong>. Complete all before processing newer ones.</>
            ) : 'No active requests.'}
          </div>
          {computedNextInLine && (
            <p className="mt-1 text-sm text-amber-800">
              Next in line: <strong className="bg-amber-200 px-1.5 py-0.5 rounded">#{computedNextInLine}</strong>
            </p>
          )}
        </div>

        {/* Filter Buttons */}
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

        {/* Search Bar */}
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

        {/* Table */}
        <div className="bg-white rounded-lg border border-gray-200 overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="bg-gray-50 border-b border-gray-200">
                  <th className="px-4 py-3 text-center text-xs font-semibold text-gray-500">Queue</th>
                  <th className="px-4 py-3 text-center text-xs font-semibold text-gray-500">Request ID</th>
                  {currentUser.role === 'super_admin' && (
                    <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500">Department</th>
                  )}
                  <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500">Student</th>
                  <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500">Type</th>
                  <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500">Document</th>
                  <th className="px-4 py-3 text-center text-xs font-semibold text-gray-500">Date</th>
                  <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500">Status</th>
                  <th className="px-4 py-3 text-center text-xs font-semibold text-gray-500">Actions</th>
                 </tr>
              </thead>
              <tbody>
                {processedRequests.length === 0 ? (
                  <tr>
                    <td colSpan={colSpan} className="px-4 py-12 text-center">
                      <FaFileAlt className="text-gray-300 text-3xl mx-auto mb-2" />
                      <p className="text-gray-500">No requests found</p>
                    </td>
                  </tr>
                ) : (
                  processedRequests.map((request) => {
                    const restricted = isRestrictedDocument(request.document, request.studentType);
                    const canProcess = canProcessRequest(request);
                    const isNextInLine = request.queue_number === computedNextInLine && request.displayDate === earliestActiveDate;
                    const isBlocked = !canProcess && ['pending','approved','processing'].includes(request.status);
                    const deptStyles = getDepartmentStyles(request.department);
                    const dateLabel = formatDisplayDate(request.date, request.displayDate);
                    const isOldDate = request.displayDate < todayLocal && ['pending','approved','processing'].includes(request.status);
                    
                    return (
                      <tr 
                        key={request.id} 
                        className={`border-b border-gray-100 transition-colors ${
                          !isBlocked 
                            ? 'cursor-pointer hover:bg-blue-50' 
                            : 'cursor-not-allowed hover:bg-gray-50'
                        } ${restricted ? 'bg-rose-50/30' : ''}`}
                        onClick={() => handleRowClick(request.id, isBlocked)}
                      >
                        <td className="px-4 py-3">
                          <div className="flex items-center justify-center gap-2">
                            <span className={`inline-flex items-center justify-center w-8 h-8 rounded-lg text-sm font-bold ${
                              isNextInLine ? 'bg-emerald-500 text-white' :
                              isBlocked ? 'bg-gray-200 text-gray-400' : 'bg-gray-100 text-gray-700'
                            }`}>#{request.queue_number}</span>
                            {isBlocked && (
                              <span className="text-xs text-gray-400 flex items-center gap-1">
                                <FaLock className="w-3 h-3" />
                                {isOldDate ? 'Yesterday' : 'Locked'}
                              </span>
                            )}
                            {isNextInLine && <span className="text-xs bg-emerald-100 text-emerald-700 px-1.5 py-0.5 rounded">Next</span>}
                            {request.isOverflow && (
                              <span className="text-xs bg-red-100 text-red-700 px-1.5 py-0.5 rounded flex items-center gap-1" title="Exceeded daily limit, may be processed later">
                                <FaExclamationCircle className="w-3 h-3" /> Overflow
                              </span>
                            )}
                          </div>
                        </td>
                        <td className="px-4 py-3 text-center">
                          <span className="text-sm font-mono text-[#7A0019]">{request.id}</span>
                        </td>
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
                        <td className="px-4 py-3 text-sm text-gray-500 text-center">
                          <div className="flex items-center justify-center gap-1">
                            <FaCalendarDay className="text-gray-400 w-3 h-3" />
                            {dateLabel}
                          </div>
                        </td>
                        <td className="px-4 py-3"><StatusBadge status={request.status} /></td>
                        <td className="px-4 py-3 text-center">
                          {/* View button - still here for clarity, but row click also works */}
                          {!isBlocked && (
                            <div className="inline-flex items-center justify-center gap-1.5 px-2 py-1.5 bg-blue-50 text-blue-600 rounded-lg transition group">
                              <ViewDetailsIcon className="w-4 h-4" />
                              <span className="text-xs font-medium hidden sm:inline">View</span>
                            </div>
                          )}
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

        {/* Restricted Docs Notice */}
        <div className="mt-5 bg-amber-50 rounded-lg p-3 border border-amber-200">
          <p className="text-xs text-amber-700">
            <strong>Note:</strong> TOR, Diploma, CAV, Authentication are NOT AVAILABLE for current students. Only Alumni can request these documents.
          </p>
        </div>
      </div>
    </div>
  );
};

export default Requests;
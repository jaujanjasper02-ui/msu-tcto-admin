import React, { useState, useEffect, useCallback, useRef } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import {
  FaSpinner, FaFileAlt, FaClock, FaCheckCircle, FaTimesCircle,
  FaUsers, FaFileSignature, FaExclamationTriangle,
  FaUserGraduate, FaUserTie, FaSync,
  FaUniversity, FaIdCard, FaGraduationCap,
  FaCalendarWeek, FaCalendarDay, FaBook,
  FaRegClock, FaArrowRight, FaChartLine
} from 'react-icons/fa';

const API_BASE_URL = import.meta.env.VITE_API_URL || 'https://msu-tcto-backend-nta0.onrender.com/api';

const DEFAULT_ACTIVITY = {
  weekly: [0, 0, 0, 0, 0, 0, 0],
  monthly: Array(12).fill(0),
  labels: {
    weekly: ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'],
    monthly: ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec']
  }
};

// ============================================
// STAT CARD COMPONENT (Simplified)
// ============================================
const StatCard = ({ title, value, color, icon: Icon, onClick }) => (
  <div 
    onClick={onClick}
    className="group bg-white rounded-xl p-4 cursor-pointer transition-all duration-200 hover:shadow-md hover:-translate-y-0.5 border border-gray-100"
  >
    <div className="flex items-center justify-between">
      <div className={`w-10 h-10 rounded-lg flex items-center justify-center ${color}`}>
        <Icon className="w-5 h-5 text-white" />
      </div>
      <p className="text-2xl font-bold text-gray-800">{value.toLocaleString()}</p>
    </div>
    <p className="text-sm text-gray-500 mt-2">{title}</p>
  </div>
);

// ============================================
// PROGRESS BAR COMPONENT (Simplified)
// ============================================
const ProgressBar = ({ label, value, percentage, color, onClick }) => {
  const safePercent = Math.min(Math.max(percentage || 0, 0), 100);
  
  return (
    <div 
      className="mb-3 cursor-pointer hover:opacity-80 transition"
      onClick={onClick}
    >
      <div className="flex justify-between items-center mb-1">
        <span className="text-xs font-medium text-gray-700 truncate flex-1" title={label}>
          {label}
        </span>
        <span className="text-xs font-semibold text-gray-900 ml-2">{value}</span>
      </div>
      <div className="w-full bg-gray-100 rounded-full h-1.5 overflow-hidden">
        <div 
          className={`h-full rounded-full ${color} transition-all duration-500`}
          style={{ width: `${safePercent}%` }}
        ></div>
      </div>
    </div>
  );
};

// ============================================
// ACTIVITY CHART COMPONENT (Simplified)
// ============================================
const ActivityChart = ({ data, labels, type, onBarClick, isLoading = false }) => {
  const maxValue = Math.max(...data, 1);
  
  if (isLoading) {
    return (
      <div className="bg-white rounded-xl p-6 text-center border border-gray-100">
        <div className="w-12 h-12 bg-gray-100 rounded-full mx-auto mb-3 animate-pulse"></div>
        <div className="h-3 w-24 bg-gray-100 rounded mx-auto"></div>
      </div>
    );
  }
  
  if (data.every(v => v === 0)) {
    return (
      <div className="bg-white rounded-xl p-6 text-center border border-gray-100">
        <FaChartLine className="text-gray-300 text-3xl mx-auto mb-2" />
        <p className="text-gray-400 text-sm">No data available</p>
      </div>
    );
  }
  
  return (
    <div className="bg-white rounded-xl p-4 border border-gray-100">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-sm font-semibold text-gray-700">
          {type === 'weekly' ? 'Weekly Activity' : 'Monthly Activity'}
        </h3>
        <span className="text-xs text-gray-400">Total: {data.reduce((a, b) => a + b, 0)}</span>
      </div>
      
      <div className="h-40 flex items-end justify-between gap-1">
        {data.map((value, idx) => {
          const height = maxValue > 0 ? (value / maxValue) * 100 : 0;
          return (
            <div key={idx} className="flex-1 flex flex-col items-center group">
              <div 
                className="w-full bg-gradient-to-t from-[#7A0019] to-[#0038A8] rounded-t transition-all cursor-pointer hover:opacity-80"
                style={{ height: `${Math.max(height, 4)}px`, minHeight: '4px' }}
                onClick={() => onBarClick?.(labels[idx])}
              ></div>
              <span className="text-[10px] text-gray-400 mt-1">{labels[idx]}</span>
            </div>
          );
        })}
      </div>
    </div>
  );
};

// ============================================
// MAIN DASHBOARD COMPONENT (Simplified)
// ============================================
const Dashboard = () => {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState('');
  const [lastUpdated, setLastUpdated] = useState(null);
  const [activityType, setActivityType] = useState('weekly');
  const [dashboardData, setDashboardData] = useState({
    total: 0,
    pending: 0,
    processing: 0,
    ready: 0,
    claimed: 0,
    rejected: 0,
    documentDistribution: [],
    departmentDistribution: [],
    courseDistribution: [],
    yearLevelDistribution: [],
    userTypeDistribution: [],
    activityData: DEFAULT_ACTIVITY
  });

  const fetchDashboardStats = useCallback(async () => {
    setLoading(true);
    setError('');
    
    try {
      const token = localStorage.getItem('authToken');
      if (!token) {
        setError('Not authenticated');
        setLoading(false);
        return;
      }

      const response = await fetch(`${API_BASE_URL}/requests/dashboard-stats`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });

      if (!response.ok) throw new Error('Failed to fetch');

      const data = await response.json();
      setDashboardData({
        total: data.total || 0,
        pending: data.pending || 0,
        processing: data.processing || 0,
        ready: data.ready || 0,
        claimed: data.claimed || 0,
        rejected: data.rejected || 0,
        documentDistribution: data.documentDistribution || [],
        departmentDistribution: data.departmentDistribution || [],
        courseDistribution: data.courseDistribution || [],
        yearLevelDistribution: data.yearLevelDistribution || [],
        userTypeDistribution: data.userTypeDistribution || [],
        activityData: data.activityData || DEFAULT_ACTIVITY
      });
      setLastUpdated(new Date());
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useEffect(() => {
    fetchDashboardStats();
  }, [fetchDashboardStats]);

  const handleStatCardClick = (status) => {
    navigate(status === 'total' ? '/admin/requests' : `/admin/requests?status=${status}`);
  };

  const handleProgressBarClick = (type, name) => {
    navigate(`/admin/requests?search=${encodeURIComponent(name)}`);
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="w-8 h-8 border-2 border-[#7A0019] border-t-transparent rounded-full animate-spin mx-auto"></div>
          <p className="text-gray-500 text-sm mt-3">Loading dashboard...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
        <div className="bg-white rounded-xl p-6 text-center max-w-md">
          <FaExclamationTriangle className="text-red-500 text-3xl mx-auto mb-3" />
          <p className="text-gray-600 mb-4">{error}</p>
          <button onClick={fetchDashboardStats} className="px-4 py-2 bg-[#7A0019] text-white rounded-lg text-sm">
            Try Again
          </button>
        </div>
      </div>
    );
  }

  const currentActivity = dashboardData.activityData[activityType === 'weekly' ? 'weekly' : 'monthly'];
  const currentLabels = dashboardData.activityData.labels[activityType === 'weekly' ? 'weekly' : 'monthly'];

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-[1400px] mx-auto px-4 py-6">
        
        {/* ========== HEADER ========== */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
          <div>
            <h1 className="text-2xl font-bold text-[#5F0231]">Dashboard</h1>
            <p className="text-sm text-gray-500 mt-0.5">Overview of document requests</p>
          </div>
          
          <div className="flex items-center gap-3">
            {lastUpdated && (
              <span className="text-xs text-gray-400">
                Updated {lastUpdated.toLocaleTimeString()}
              </span>
            )}
            <button 
              onClick={() => fetchDashboardStats()}
              disabled={refreshing}
              className="p-2 bg-white rounded-lg text-gray-500 hover:text-[#7A0019] border border-gray-200"
            >
              <FaSync className={`w-4 h-4 ${refreshing ? 'animate-spin' : ''}`} />
            </button>
            <Link 
              to="/admin/requests" 
              className="px-4 py-2 bg-[#7A0019] text-white text-sm font-medium rounded-lg hover:bg-[#5a0012] transition flex items-center gap-2"
            >
              View Requests
              <FaArrowRight className="w-3 h-3" />
            </Link>
          </div>
        </div>

        {/* ========== STATS CARDS ========== */}
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3 mb-6">
          <StatCard title="Total" value={dashboardData.total} color="bg-blue-500" icon={FaFileAlt} onClick={() => handleStatCardClick('total')} />
          <StatCard title="Pending" value={dashboardData.pending} color="bg-amber-500" icon={FaClock} onClick={() => handleStatCardClick('pending')} />
          <StatCard title="Processing" value={dashboardData.processing} color="bg-indigo-500" icon={FaSpinner} onClick={() => handleStatCardClick('processing')} />
          <StatCard title="Ready" value={dashboardData.ready} color="bg-purple-500" icon={FaCheckCircle} onClick={() => handleStatCardClick('ready')} />
          <StatCard title="Claimed" value={dashboardData.claimed} color="bg-green-500" icon={FaCheckCircle} onClick={() => handleStatCardClick('claimed')} />
          <StatCard title="Rejected" value={dashboardData.rejected} color="bg-red-500" icon={FaTimesCircle} onClick={() => handleStatCardClick('rejected')} />
        </div>

        {/* ========== ACTIVITY CHART ========== */}
        <div className="mb-6">
          <div className="flex items-center justify-between mb-3">
            <h2 className="text-sm font-semibold text-gray-700">Activity Overview</h2>
            <div className="flex gap-2">
              <button
                onClick={() => setActivityType('weekly')}
                className={`px-3 py-1 text-xs rounded-lg transition ${activityType === 'weekly' ? 'bg-[#7A0019] text-white' : 'bg-white text-gray-600 border'}`}
              >
                Weekly
              </button>
              <button
                onClick={() => setActivityType('monthly')}
                className={`px-3 py-1 text-xs rounded-lg transition ${activityType === 'monthly' ? 'bg-[#7A0019] text-white' : 'bg-white text-gray-600 border'}`}
              >
                Monthly
              </button>
            </div>
          </div>
          <ActivityChart 
            data={currentActivity}
            labels={currentLabels}
            type={activityType}
            onBarClick={(label) => navigate(`/admin/requests?date=${label}`)}
          />
        </div>

        {/* ========== DISTRIBUTION GRID ========== */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-5 mb-6">
          
          {/* Documents Card */}
          <div className="bg-white rounded-xl border border-gray-100 p-4">
            <div className="flex items-center gap-2 mb-3">
              <FaFileSignature className="text-[#7A0019] text-sm" />
              <h3 className="font-semibold text-gray-800 text-sm">Document Requests</h3>
            </div>
            <div className="max-h-64 overflow-y-auto">
              {dashboardData.documentDistribution.length > 0 ? (
                dashboardData.documentDistribution.slice(0, 6).map((doc, idx) => (
                  <ProgressBar 
                    key={idx}
                    label={doc.name}
                    value={doc.count}
                    percentage={Number(doc.percentage)}
                    color="bg-gradient-to-r from-[#7A0019] to-[#0038A8]"
                    onClick={() => handleProgressBarClick('document', doc.name)}
                  />
                ))
              ) : (
                <p className="text-gray-400 text-sm text-center py-6">No data</p>
              )}
            </div>
          </div>

          {/* Courses Card */}
          <div className="bg-white rounded-xl border border-gray-100 p-4">
            <div className="flex items-center gap-2 mb-3">
              <FaBook className="text-green-600 text-sm" />
              <h3 className="font-semibold text-gray-800 text-sm">Course Distribution</h3>
            </div>
            <div className="max-h-64 overflow-y-auto">
              {dashboardData.courseDistribution.length > 0 ? (
                dashboardData.courseDistribution.slice(0, 6).map((course, idx) => (
                  <ProgressBar 
                    key={idx}
                    label={course.name}
                    value={course.count}
                    percentage={Number(course.percentage)}
                    color="bg-gradient-to-r from-green-500 to-emerald-600"
                    onClick={() => handleProgressBarClick('course', course.name)}
                  />
                ))
              ) : (
                <p className="text-gray-400 text-sm text-center py-6">No data</p>
              )}
            </div>
          </div>

          {/* Departments Card */}
          <div className="bg-white rounded-xl border border-gray-100 p-4">
            <div className="flex items-center gap-2 mb-3">
              <FaUniversity className="text-blue-600 text-sm" />
              <h3 className="font-semibold text-gray-800 text-sm">Departments</h3>
            </div>
            <div className="max-h-64 overflow-y-auto">
              {dashboardData.departmentDistribution.length > 0 ? (
                dashboardData.departmentDistribution.slice(0, 6).map((dept, idx) => (
                  <ProgressBar 
                    key={idx}
                    label={dept.name}
                    value={dept.count}
                    percentage={Number(dept.percentage)}
                    color="bg-gradient-to-r from-blue-500 to-blue-600"
                    onClick={() => handleProgressBarClick('department', dept.name)}
                  />
                ))
              ) : (
                <p className="text-gray-400 text-sm text-center py-6">No data</p>
              )}
            </div>
          </div>
        </div>

        {/* ========== SECONDARY INSIGHTS ========== */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
          
          {/* User Distribution */}
          <div className="bg-gray-800 rounded-xl p-4">
            <div className="flex items-center gap-2 mb-3">
              <FaUsers className="text-white/70 text-sm" />
              <h3 className="font-semibold text-white text-sm">User Distribution</h3>
            </div>
            <div className="space-y-3">
              {dashboardData.userTypeDistribution.length > 0 ? (
                dashboardData.userTypeDistribution.map((item, idx) => {
                  const Icon = item.type === 'Student' ? FaUserGraduate : FaUserTie;
                  return (
                    <div key={idx} className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <Icon className="text-white/50 text-sm" />
                        <span className="text-white text-sm">{item.type}</span>
                      </div>
                      <div className="flex items-center gap-3">
                        <span className="text-white font-semibold">{item.count}</span>
                        <span className="text-white/40 text-xs">{item.percentage}%</span>
                      </div>
                    </div>
                  );
                })
              ) : (
                <p className="text-white/40 text-sm text-center py-4">No data</p>
              )}
            </div>
          </div>

          {/* Quick Insights */}
          <div className="bg-white rounded-xl border border-gray-100 p-4">
            <div className="flex items-center gap-2 mb-3">
              <FaIdCard className="text-[#7A0019] text-sm" />
              <h3 className="font-semibold text-gray-800 text-sm">Quick Insights</h3>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div className="bg-gray-50 rounded-lg p-3">
                <p className="text-xs text-gray-500">Students</p>
                <p className="text-xl font-bold text-gray-800">
                  {dashboardData.userTypeDistribution.find(u => u.type === 'Student')?.count || 0}
                </p>
              </div>
              <div className="bg-gray-50 rounded-lg p-3">
                <p className="text-xs text-gray-500">Alumni</p>
                <p className="text-xl font-bold text-gray-800">
                  {dashboardData.userTypeDistribution.find(u => u.type === 'Alumni')?.count || 0}
                </p>
              </div>
              <div className="bg-gray-50 rounded-lg p-3">
                <p className="text-xs text-gray-500">Document Types</p>
                <p className="text-xl font-bold text-gray-800">
                  {dashboardData.documentDistribution.filter(d => d.count > 0).length}
                </p>
              </div>
              <div className="bg-amber-50 rounded-lg p-3">
                <p className="text-xs text-amber-600">Pending Action</p>
                <p className="text-xl font-bold text-amber-700">{dashboardData.pending}</p>
              </div>
            </div>
          </div>
        </div>

        {/* ========== WARNING BANNER ========== */}
        <div className="mt-6 bg-amber-50 rounded-lg p-3 border border-amber-200">
          <p className="text-xs text-amber-700">
            <strong>Note:</strong> TOR, Diploma, CAV, Authentication are NOT AVAILABLE for current students. Only Alumni can request these documents.
          </p>
        </div>
      </div>
    </div>
  );
};

export default Dashboard;
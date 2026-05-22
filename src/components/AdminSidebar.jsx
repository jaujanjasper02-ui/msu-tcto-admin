import React, { useState, useEffect, useCallback } from 'react';
import { NavLink, useNavigate } from 'react-router-dom';
import { 
  FaTachometerAlt, 
  FaFileAlt, 
  FaHistory, 
  FaCog, 
  FaUsersCog,
  FaSignOutAlt,
  FaBuilding
} from 'react-icons/fa';

const MSULogoFallback = () => (
  <div className="h-10 w-10 rounded-lg bg-gradient-to-br from-[#7A0019] to-[#0038A8] flex items-center justify-center shadow-md">
    <span className="text-white font-bold text-xs">MSU</span>
  </div>
);

const AdminSidebar = ({ isOpen, closeSidebar, toggleSidebar }) => {
  const navigate = useNavigate();
  const [userInfo, setUserInfo] = useState({
    name: 'Admin User',
    email: 'admin@msutcto.edu.ph',
    initials: 'AD',
    role: 'staff',
    department: 'CCS'
  });
  
  const [pendingCount, setPendingCount] = useState(0);
  const [isLoadingCount, setIsLoadingCount] = useState(false);
  const [logoError, setLogoError] = useState(false);

  const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000/api';

  useEffect(() => {
    const userData = localStorage.getItem('currentUser');
    if (userData) {
      try {
        const parsed = JSON.parse(userData);
        const user = parsed.user || parsed;
        
        let displayName = 'Admin User';
        if (user.name) {
          displayName = user.name;
        } else if (user.firstName && user.lastName) {
          displayName = `${user.firstName} ${user.lastName}`;
        } else if (user.first_name && user.last_name) {
          displayName = `${user.first_name} ${user.last_name}`;
        }
        
        const email = user.email || 'admin@msutcto.edu.ph';
        const role = user.role || 'staff';
        const department = user.department || 'CCS';
        
        const initials = displayName
          .split(' ')
          .map(n => n[0])
          .join('')
          .substring(0, 2)
          .toUpperCase();
        
        setUserInfo({
          name: displayName,
          email: email,
          initials: initials,
          role: role,
          department: department
        });
      } catch (error) {
        console.error('Error parsing user data:', error);
      }
    }
  }, []);

  const fetchPendingCount = useCallback(async () => {
    setIsLoadingCount(true);
    try {
      const token = localStorage.getItem('authToken');
      if (!token) return;

      const response = await fetch(`${API_BASE_URL}/requests/pending-count`, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });

      if (response.ok) {
        const data = await response.json();
        setPendingCount(data.count || 0);
      }
    } catch (err) {
      console.error('Error fetching pending count:', err);
    } finally {
      setIsLoadingCount(false);
    }
  }, [API_BASE_URL]);

  useEffect(() => {
    fetchPendingCount();
    const interval = setInterval(fetchPendingCount, 10000);
    return () => clearInterval(interval);
  }, [fetchPendingCount]);

  const getDepartmentDisplay = (dept) => {
    const deptNames = {
      'CCS': 'College of Computer Studies',
      'COED': 'College of Education',
      'CAS': 'College of Arts and Sciences',
      'COF': 'College of Fisheries',
      'CIAS': 'College of Islamic and Arabic Studies',
      'IOES': 'Institute of Oceanography',
      'ALL': 'All Departments'
    };
    return deptNames[dept] || dept;
  };

  const baseNavItems = [
    { path: '/admin/dashboard', icon: <FaTachometerAlt className="w-5 h-5" />, label: 'Dashboard', description: 'Overview & analytics' },
    { path: '/admin/requests', icon: <FaFileAlt className="w-5 h-5" />, label: 'Requests', description: 'Manage document requests' },
    { path: '/admin/activity-logs', icon: <FaHistory className="w-5 h-5" />, label: 'Activity Logs', description: 'Track admin actions' },
    { path: '/admin/settings', icon: <FaCog className="w-5 h-5" />, label: 'Settings', description: 'System configuration' },
  ];

  const adminUsersItem = { path: '/admin/users', icon: <FaUsersCog className="w-5 h-5" />, label: 'Admin Users', description: 'Manage staff accounts' };

  const navItems = userInfo.role === 'super_admin' 
    ? [...baseNavItems, adminUsersItem]
    : baseNavItems;

  const handleLogout = () => {
    localStorage.removeItem('authToken');
    localStorage.removeItem('currentUser');
    localStorage.removeItem('authResponse');
    navigate('/login');
  };

  return (
    <>
      {isOpen && (
        <div
          className="fixed inset-0 bg-black/50 backdrop-blur-sm z-40 lg:hidden"
          onClick={closeSidebar}
        />
      )}

      <aside
        className={`
          fixed inset-y-0 left-0 z-50
          w-72 bg-gradient-to-b from-white via-white to-gray-50
          transform transition-all duration-300 ease-out
          flex flex-col h-screen shadow-2xl
          ${isOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'}
          lg:shadow-xl
        `}
      >
        {/* ========== LOGO SECTION ========== */}
        <div className="relative p-5 border-b border-gray-100">
          <div className="flex items-center gap-3">
            {!logoError ? (
              <img
                src="/Msu-Tcto_Logo.jpg"
                alt="Msu-Tcto_Logo"
                className="h-10 w-10 rounded-lg object-cover shadow-md"
                onError={() => setLogoError(true)}
                loading="lazy"
              />
            ) : (
              <MSULogoFallback />
            )}
            <div>
              <h1 className="font-bold text-[#5F0231] text-lg">MSU-TCTO</h1>
              <p className="text-[10px] text-[#285ccc] uppercase tracking-wide">Queuing System with Notification</p>
            </div>
          </div>
          
          <button
            onClick={closeSidebar}
            className="absolute top-5 right-4 p-1 lg:hidden text-gray-400 hover:text-[#7A0019] rounded-lg hover:bg-gray-100 transition"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        {/* ========== USER PROFILE SECTION ========== */}
        <div className="m-4 p-3 bg-gradient-to-r from-[#7A0019]/5 via-white to-[#0038A8]/5 rounded-xl border border-gray-100 shadow-sm">
          <div className="flex items-center gap-3">
            <div className="relative">
              <div className="w-12 h-12 bg-gradient-to-br from-[#7A0019] to-[#0038A8] rounded-xl flex items-center justify-center shadow-md">
                <span className="text-white font-bold text-base">{userInfo.initials}</span>
              </div>
              <div className="absolute -bottom-0.5 -right-0.5 w-3.5 h-3.5 bg-green-500 rounded-full border-2 border-white shadow-sm"></div>
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-bold text-gray-800 truncate">{userInfo.name}</p>
              <p className="text-xs text-gray-500 truncate">{userInfo.email}</p>
              <div className="flex items-center gap-1 mt-1">
                <div className={`w-1.5 h-1.5 rounded-full ${userInfo.role === 'super_admin' ? 'bg-red-500' : 'bg-blue-500'}`}></div>
                <span className={`text-[10px] font-semibold ${
                  userInfo.role === 'super_admin' ? 'text-red-600' : 'text-blue-600'
                }`}>
                  {userInfo.role === 'super_admin' ? 'Registrar' : 'Staff'}
                </span>
              </div>
              {userInfo.role !== 'super_admin' && (
                <div className="flex items-center gap-1 mt-1 text-[10px] text-gray-500">
                  <FaBuilding className="w-2.5 h-2.5" />
                  <span>Managing: {getDepartmentDisplay(userInfo.department)}</span>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* ========== NAVIGATION MENU ========== */}
        <nav className="flex-1 px-3 py-2 overflow-y-auto">
          <div className="space-y-1">
            {navItems.map((item) => (
              <NavLink
                key={item.path}
                to={item.path}
                onClick={closeSidebar}
                className={({ isActive }) => `
                  group relative flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-all duration-200
                  ${isActive
                    ? 'bg-gradient-to-r from-[#7A0019]/10 to-[#0038A8]/5 text-[#7A0019] shadow-sm'
                    : 'text-gray-600 hover:text-[#7A0019] hover:bg-gray-50'
                  }
                `}
              >
                {({ isActive }) => (
                  <>
                    {isActive && (
                      <div className="absolute left-0 top-1/2 -translate-y-1/2 w-1 h-6 bg-gradient-to-b from-[#7A0019] to-[#0038A8] rounded-full"></div>
                    )}
                    
                    <span className={`transition-all duration-200 group-hover:scale-110 ${isActive ? 'text-[#7A0019]' : 'text-gray-400 group-hover:text-[#7A0019]'}`}>
                      {item.icon}
                    </span>
                    
                    <div className="flex-1">
                      <span className="block">{item.label}</span>
                    </div>
                    
                    {item.label === 'Requests' && pendingCount > 0 && (
                      <span className="px-1.5 py-0.5 text-[10px] font-bold rounded-full bg-red-500 text-white shadow-sm">
                        {pendingCount}
                      </span>
                    )}
                  </>
                )}
              </NavLink>
            ))}
          </div>
        </nav>

        {/* ========== FOOTER ========== */}
        <div className="p-4 border-t border-gray-100 bg-gradient-to-r from-gray-50 to-white">
          <button
            onClick={handleLogout}
            className="group flex items-center gap-3 w-full px-3 py-2.5 text-sm font-medium text-red-600 hover:bg-red-50 rounded-xl transition-all duration-200"
          >
            <FaSignOutAlt className="w-4 h-4 transition-transform duration-200 group-hover:scale-110 group-hover:translate-x-0.5" />
            <span>Sign Out</span>
          </button>
          
          <p className="text-[9px] text-center text-gray-300 mt-3">
            © 2026 MSU-TCTO Registrar
          </p>
        </div>
      </aside>
    </>
  );
};

export default AdminSidebar;

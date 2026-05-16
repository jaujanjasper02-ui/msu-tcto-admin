import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import AdminCard from '../components/AdminCard';
import AdminTable from '../components/AdminTable';
import Modal, { ConfirmationModal } from '../components/Modal';

const AdminUsers = () => {
  const navigate = useNavigate();
  const [isAuthorized, setIsAuthorized] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [showAddModal, setShowAddModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [selectedUser, setSelectedUser] = useState(null);
  const [loading, setLoading] = useState(false);
  const [adminUsers, setAdminUsers] = useState([]);
  const [fetchLoading, setFetchLoading] = useState(true);

  const [toast, setToast] = useState({ show: false, message: '', type: '' });

  const [newUser, setNewUser] = useState({
    name: '',
    email: '',
    department: 'CCS'
  });

  const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000/api';

  const showToast = (message, type = 'success') => {
    setToast({ show: true, message, type });
    setTimeout(() => setToast({ show: false, message: '', type: '' }), 3000);
  };

  const departments = [
    { code: 'CCS', name: 'College of Computer Studies (CCS)' },
    { code: 'COED', name: 'College of Education (COED)' },
    { code: 'CAS', name: 'College of Arts and Sciences (CAS)' },
    { code: 'COF', name: 'College of Fisheries (COF)' },
    { code: 'CIAS', name: 'College of Islamic and Arabic Studies (CIAS)' },
    { code: 'IOES', name: 'Institute of Oceanography (IOES)' },
    { code: 'ALL', name: 'ALL DEPARTMENTS (Registrar)' }
  ];

  const getDepartmentDisplay = (department) => {
    const dept = departments.find(d => d.code === department);
    return dept ? dept.name : department;
  };

  const getDepartmentBadge = (department) => {
    if (department === 'ALL') {
      return <span className="px-2 py-1 rounded-md text-xs font-medium bg-purple-100 text-purple-700">📋 All Departments</span>;
    }
    const colors = {
      'CCS': 'bg-blue-100 text-blue-700',
      'COED': 'bg-green-100 text-green-700',
      'CAS': 'bg-yellow-100 text-yellow-700',
      'COF': 'bg-cyan-100 text-cyan-700',
      'CIAS': 'bg-emerald-100 text-emerald-700',
      'IOES': 'bg-teal-100 text-teal-700'
    };
    return (
      <span className={`px-2 py-1 rounded-md text-xs font-medium ${colors[department] || 'bg-gray-100 text-gray-700'}`}>
        📁 {department}
      </span>
    );
  };

  useEffect(() => {
    const userData = localStorage.getItem('currentUser');
    if (userData) {
      try {
        const parsed = JSON.parse(userData);
        const user = parsed.user || parsed;
        const role = user.role || 'staff';
        
        if (role !== 'super_admin') {
          navigate('/admin/dashboard');
        } else {
          setIsAuthorized(true);
          fetchAdminUsers();
        }
      } catch (error) {
        console.error('Error checking authorization:', error);
        navigate('/admin/dashboard');
      }
    } else {
      navigate('/login');
    }
  }, [navigate]);

  // ✅ UPDATED: fetch users from /api/admin/users (not /admin-users)
  const fetchAdminUsers = async () => {
    setFetchLoading(true);
    try {
      const token = localStorage.getItem('authToken');
      const response = await fetch(`${API_BASE_URL}/admin/users`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });

      if (!response.ok) throw new Error('Failed to fetch users');

      const data = await response.json();
      setAdminUsers(data.users || []);
    } catch (error) {
      console.error('Error fetching admin users:', error);
      showToast('Failed to load staff members', 'error');
    } finally {
      setFetchLoading(false);
    }
  };

  const filteredUsers = adminUsers.filter(user => {
    if (!searchTerm) return true;
    return user.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
           user.email?.toLowerCase().includes(searchTerm.toLowerCase()) ||
           user.department?.toLowerCase().includes(searchTerm.toLowerCase());
  });

  const stats = [
    {
      title: 'Total Staff',
      value: adminUsers.length.toString(),
      color: 'maroon',
      icon: (
        <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197m13.5 1.197v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z" />
        </svg>
      )
    },
    {
      title: 'Active Staff',
      value: adminUsers.filter(u => u.status === 'active').length.toString(),
      color: 'green',
      icon: (
        <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
        </svg>
      )
    },
    {
      title: 'Registrar',
      value: adminUsers.filter(u => u.role === 'super_admin').length.toString(),
      color: 'gold',
      icon: (
        <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
        </svg>
      )
    }
  ];

  // ✅ UPDATED: POST to /api/admin/users
  const handleAddUser = async () => {
    if (!newUser.name || !newUser.email) {
      showToast('Please fill in all required fields', 'error');
      return;
    }

    if (!/^\S+@\S+\.\S+$/.test(newUser.email)) {
      showToast('Please enter a valid email address', 'error');
      return;
    }

    setLoading(true);
    try {
      const token = localStorage.getItem('authToken');
      const response = await fetch(`${API_BASE_URL}/admin/users`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ 
          ...newUser, 
          role: 'staff'
        })
      });

      const data = await response.json();
      if (!response.ok) throw new Error(data.message);

      showToast(`Staff member added successfully! Invitation email sent to ${newUser.email}`, 'success');
      setShowAddModal(false);
      setNewUser({ name: '', email: '', department: 'CCS' });
      fetchAdminUsers();
    } catch (error) {
      showToast(error.message, 'error');
    } finally {
      setLoading(false);
    }
  };

  // ✅ UPDATED: PUT to /api/admin/users/:id
  const handleUpdateUser = async () => {
    if (!selectedUser) return;
    setLoading(true);
    try {
      const token = localStorage.getItem('authToken');
      const response = await fetch(`${API_BASE_URL}/admin/users/${selectedUser.id}`, {
        method: 'PUT',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          name: selectedUser.name,
          email: selectedUser.email,
          status: selectedUser.status,
          role: selectedUser.role,
          department: selectedUser.department
        })
      });

      const data = await response.json();
      if (!response.ok) throw new Error(data.message);

      showToast('Staff member updated successfully', 'success');
      setShowEditModal(false);
      setSelectedUser(null);
      fetchAdminUsers();
    } catch (error) {
      showToast(error.message, 'error');
    } finally {
      setLoading(false);
    }
  };

  // ✅ UPDATED: DELETE to /api/admin/users/:id
  const handleDeleteUser = async () => {
    setLoading(true);
    try {
      const token = localStorage.getItem('authToken');
      const response = await fetch(`${API_BASE_URL}/admin/users/${selectedUser.id}`, {
        method: 'DELETE',
        headers: { 'Authorization': `Bearer ${token}` }
      });

      const data = await response.json();
      if (!response.ok) throw new Error(data.message);

      showToast('Staff member removed successfully', 'success');
      setShowDeleteModal(false);
      setSelectedUser(null);
      fetchAdminUsers();
    } catch (error) {
      showToast(error.message, 'error');
    } finally {
      setLoading(false);
    }
  };

  // ✅ UPDATED: POST reset-password to /api/admin/users/:id/reset-password
  const handleResetPassword = async (user) => {
    if (!window.confirm(`Send password reset email to ${user.name}?`)) return;
    
    try {
      const token = localStorage.getItem('authToken');
      const response = await fetch(`${API_BASE_URL}/admin/users/${user.id}/reset-password`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ email: user.email, name: user.name })
      });

      const data = await response.json();
      if (!response.ok) throw new Error(data.message);

      showToast(`Password reset email sent to ${user.email}`, 'success');
    } catch (error) {
      showToast(error.message, 'error');
    }
  };

  const getRoleBadge = (user) => {
    if (user.role === 'super_admin') {
      return <span className="px-2 py-1 rounded-md text-xs font-medium bg-red-100 text-red-700">👑 Registrar</span>;
    }
    return <span className="px-2 py-1 rounded-md text-xs font-medium bg-blue-100 text-blue-700">Staff</span>;
  };

  const getStatusBadge = (status) => {
    return status === 'active' ? (
      <span className="px-2 py-1 rounded-md text-xs font-medium bg-green-100 text-green-700">Active</span>
    ) : (
      <span className="px-2 py-1 rounded-md text-xs font-medium bg-gray-100 text-gray-500">Inactive</span>
    );
  };

  const columns = [
    {
      key: 'name',
      header: 'Staff Member',
      render: (item) => (
        <div>
          <div className="text-sm font-medium text-gray-800">{item.name}</div>
          <div className="text-xs text-gray-400">{item.email}</div>
        </div>
      )
    },
    {
      key: 'department',
      header: 'Department',
      render: (item) => getDepartmentBadge(item.department)
    },
    {
      key: 'role',
      header: 'Role',
      render: (item) => getRoleBadge(item)
    },
    {
      key: 'status',
      header: 'Status',
      render: (item) => getStatusBadge(item.status)
    }
  ];

  const tableActions = [
    {
      icon: (
        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
        </svg>
      ),
      label: 'Edit',
      onClick: (item) => {
        if (item.role === 'super_admin') {
          showToast('Registrar account cannot be edited', 'error');
          return;
        }
        setSelectedUser(item);
        setShowEditModal(true);
      },
      hidden: (item) => item.role === 'super_admin'
    },
    {
      icon: (
        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 7a2 2 0 012 2m4 0a6 6 0 01-7.743 5.743L11 17H9v2H7v2H4a1 1 0 01-1-1v-2.586a1 1 0 01.293-.707l5.964-5.964A6 6 0 1121 9z" />
        </svg>
      ),
      label: 'Reset Password',
      onClick: (item) => handleResetPassword(item)
    },
    {
      icon: (
        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
        </svg>
      ),
      label: 'Delete',
      onClick: (item) => {
        if (item.role === 'super_admin') {
          showToast('Registrar account cannot be deleted', 'error');
          return;
        }
        setSelectedUser(item);
        setShowDeleteModal(true);
      },
      hidden: (item) => item.role === 'super_admin'
    }
  ];

  if (!isAuthorized || fetchLoading) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-[#7A0019]"></div>
      </div>
    );
  }

  return (
    <div className="space-y-5">
      {toast.show && (
        <div className={`fixed top-20 right-6 z-50 px-4 py-2 rounded-lg shadow-lg ${toast.type === 'success' ? 'bg-green-500' : 'bg-red-500'} text-white text-sm`}>
          {toast.message}
        </div>
      )}

      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-xl font-bold text-[#5F0231]">Registrar Office Staff</h1>
          <p className="text-sm text-gray-500 mt-0.5">Manage staff members and their department assignments</p>
        </div>
        
        <button
          onClick={() => setShowAddModal(true)}
          className="px-4 py-2 bg-[#7A0019] text-white text-sm font-medium rounded-lg hover:bg-[#5a0012] transition flex items-center gap-2"
        >
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
          </svg>
          Add New Staff
        </button>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        {stats.map((stat, index) => (
          <AdminCard key={index} title={stat.title} value={stat.value} color={stat.color} icon={stat.icon} />
        ))}
      </div>

      <div className="bg-white rounded-lg border border-gray-200 p-3">
        <div className="relative">
          <svg className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
          </svg>
          <input
            type="text"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder="Search by name, email, or department..."
            className="w-full pl-9 pr-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-1 focus:ring-[#7A0019] focus:border-[#7A0019]"
          />
        </div>
      </div>

      <AdminTable
        columns={columns}
        data={filteredUsers}
        actions={tableActions}
        emptyMessage="No staff members found"
      />

      <div className="bg-gray-50 rounded-lg p-4 border border-gray-200">
        <h3 className="text-sm font-semibold text-gray-700 mb-2">Access Levels</h3>
        <div className="space-y-2">
          <div className="flex items-center gap-2">
            <span className="w-2 h-2 bg-red-500 rounded-full"></span>
            <span className="text-sm text-gray-600"><strong className="text-red-700">Registrar</strong> - Full access, can manage staff accounts, sees ALL departments</span>
          </div>
          <div className="flex items-center gap-2">
            <span className="w-2 h-2 bg-blue-500 rounded-full"></span>
            <span className="text-sm text-gray-600"><strong className="text-blue-700">Department Staff</strong> - Can ONLY see and process requests from their assigned department</span>
          </div>
        </div>
      </div>

      {/* Add User Modal */}
      <Modal
        isOpen={showAddModal}
        onClose={() => setShowAddModal(false)}
        title="Add New Staff Member"
        size="md"
        footer={
          <div className="flex justify-end gap-2">
            <button onClick={() => setShowAddModal(false)} className="px-4 py-2 bg-gray-100 text-gray-700 rounded-lg text-sm">Cancel</button>
            <button onClick={handleAddUser} disabled={loading} className="px-4 py-2 bg-[#7A0019] text-white rounded-lg text-sm hover:bg-[#5a0012] disabled:opacity-50">
              {loading ? 'Adding...' : 'Add Staff'}
            </button>
          </div>
        }
      >
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Full Name <span className="text-red-500">*</span></label>
            <input type="text" value={newUser.name} onChange={(e) => setNewUser({...newUser, name: e.target.value})} className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-1 focus:ring-[#7A0019] outline-none" placeholder="Enter full name" />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Email Address <span className="text-red-500">*</span></label>
            <input type="email" value={newUser.email} onChange={(e) => setNewUser({...newUser, email: e.target.value})} className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-1 focus:ring-[#7A0019] outline-none" placeholder="Enter email address" />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Assign to Department <span className="text-red-500">*</span></label>
            <select
              value={newUser.department}
              onChange={(e) => setNewUser({...newUser, department: e.target.value})}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-1 focus:ring-[#7A0019] outline-none"
            >
              {departments.map(dept => (
                <option key={dept.code} value={dept.code}>
                  {dept.name}
                </option>
              ))}
            </select>
            <p className="text-xs text-gray-500 mt-1">
              {newUser.department === 'ALL' 
                ? '⚠️ This staff will have FULL ACCESS to all departments (Registrar level)' 
                : 'This staff will ONLY see and process requests from this department'}
            </p>
          </div>
          <div className="bg-blue-50 p-3 rounded-lg">
            <p className="text-xs text-blue-700">An invitation email will be sent with login credentials.</p>
          </div>
        </div>
      </Modal>

      {/* Edit User Modal */}
      <Modal
        isOpen={showEditModal}
        onClose={() => setShowEditModal(false)}
        title="Edit Staff Member"
        size="md"
        footer={
          <div className="flex justify-end gap-2">
            <button onClick={() => setShowEditModal(false)} className="px-4 py-2 bg-gray-100 text-gray-700 rounded-lg text-sm">Cancel</button>
            <button onClick={handleUpdateUser} disabled={loading} className="px-4 py-2 bg-[#7A0019] text-white rounded-lg text-sm hover:bg-[#5a0012] disabled:opacity-50">
              {loading ? 'Updating...' : 'Update Staff'}
            </button>
          </div>
        }
      >
        {selectedUser && (
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Full Name</label>
              <input type="text" value={selectedUser.name} onChange={(e) => setSelectedUser({...selectedUser, name: e.target.value})} className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-1 focus:ring-[#7A0019] outline-none" />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Email Address</label>
              <input type="email" value={selectedUser.email} onChange={(e) => setSelectedUser({...selectedUser, email: e.target.value})} className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-1 focus:ring-[#7A0019] outline-none" />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Assigned Department</label>
              <select
                value={selectedUser.department}
                onChange={(e) => setSelectedUser({...selectedUser, department: e.target.value})}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-1 focus:ring-[#7A0019] outline-none"
                disabled={selectedUser.role === 'super_admin' && selectedUser.department === 'ALL'}
              >
                {departments.map(dept => (
                  <option key={dept.code} value={dept.code}>
                    {dept.name}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Status</label>
              <select value={selectedUser.status} onChange={(e) => setSelectedUser({...selectedUser, status: e.target.value})} className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-1 focus:ring-[#7A0019] outline-none">
                <option value="active">Active</option>
                <option value="inactive">Inactive</option>
              </select>
            </div>
            <div className="bg-gray-50 p-3 rounded-lg">
              <p className="text-xs text-gray-600"><strong>Role:</strong> {selectedUser.role === 'super_admin' ? 'Registrar' : 'Staff'}</p>
              <p className="text-xs text-gray-500 mt-1">
                {selectedUser.department === 'ALL' 
                  ? 'This staff has access to ALL departments' 
                  : `This staff can only process requests from ${selectedUser.department} department`}
              </p>
            </div>
          </div>
        )}
      </Modal>

      <ConfirmationModal
        isOpen={showDeleteModal}
        onClose={() => setShowDeleteModal(false)}
        onConfirm={handleDeleteUser}
        title="Remove Staff Member"
        message={`Are you sure you want to remove ${selectedUser?.name} from the system?`}
        confirmText="Remove"
        confirmColor="bg-red-600 hover:bg-red-700"
        loading={loading}
      />
    </div>
  );
};

export default AdminUsers;
import React from 'react';

// Align with Student UI: yellow(pending), blue(approved), indigo(processing), purple(ready), green(claimed), red(rejected)
const StatusBadge = ({ status, size = 'md' }) => {
  const config = {
    pending: { bg: 'bg-yellow-100', text: 'text-yellow-800', dot: 'bg-yellow-500', label: 'Pending' },
    approved: { bg: 'bg-blue-100', text: 'text-blue-800', dot: 'bg-blue-500', label: 'Approved' },
    processing: { bg: 'bg-indigo-100', text: 'text-indigo-800', dot: 'bg-indigo-500', label: 'Processing' },
    ready: { bg: 'bg-purple-100', text: 'text-purple-800', dot: 'bg-purple-500', label: 'Ready' },
    claimed: { bg: 'bg-green-100', text: 'text-green-800', dot: 'bg-green-500', label: 'Claimed' },
    completed: { bg: 'bg-green-100', text: 'text-green-800', dot: 'bg-green-500', label: 'Completed' },
    rejected: { bg: 'bg-red-100', text: 'text-red-800', dot: 'bg-red-500', label: 'Rejected' },
    verified: { bg: 'bg-green-100', text: 'text-green-800', dot: 'bg-green-500', label: 'Verified' },
    sent: { bg: 'bg-blue-100', text: 'text-blue-800', dot: 'bg-blue-500', label: 'Sent' },
    delivered: { bg: 'bg-green-100', text: 'text-green-800', dot: 'bg-green-500', label: 'Delivered' },
    failed: { bg: 'bg-red-100', text: 'text-red-800', dot: 'bg-red-500', label: 'Failed' },
  };

  const { bg, text, dot, label } = config[status?.toLowerCase()] || {
    bg: 'bg-gray-100',
    text: 'text-gray-800',
    dot: 'bg-gray-500',
    label: status || 'Unknown',
  };

  const sizeClass = {
    sm: 'px-2 py-1 text-xs',
    md: 'px-2.5 py-1.5 text-xs',
    lg: 'px-3 py-2 text-sm',
  }[size];

  return (
    <span className={`inline-flex items-center rounded-full font-medium ${bg} ${text} ${sizeClass}`}>
      <span className={`w-1.5 h-1.5 rounded-full mr-1.5 ${dot}`}></span>
      {label}
    </span>
  );
};

export default StatusBadge;
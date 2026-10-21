import { useState } from 'react';
import '../../../App.css';

// Mock data representing departmental requests
const mockRequests = [
  {
    id: "REQ-001",
    itemDescription: "High-Performance Workstation Laptops",
    manufacturer: "Dell",
    quantity: 5,
    estimatedPrice: 7500,
    department: "Engineering",
    requestingTeam: "AI Engineering",
    project: "LLM Pipeline",
    summary: "Required for training local lightweight LLM models.",
    status: "Approved",
    submittedDate: "2026-10-10",
  },
  {
    id: "REQ-002",
    itemDescription: "Cloud Infrastructure Server Credits",
    manufacturer: "AWS",
    quantity: 1,
    estimatedPrice: 3200,
    department: "Engineering",
    requestingTeam: "DevOps",
    project: "Production Migration",
    summary: "Monthly compute budget for staging environments.",
    status: "Pending",
    submittedDate: "2026-10-14",
  },
  {
    id: "REQ-003",
    itemDescription: "Procurement Management Software Licenses",
    manufacturer: "SAP",
    quantity: 10,
    estimatedPrice: 1500,
    department: "Marketing & Procurement",
    requestingTeam: "Procurement Ops",
    project: "Vendor Optimization",
    summary: "Enterprise licenses for vendor tracking.",
    status: "Queried",
    submittedDate: "2026-10-12",
  },
  {
    id: "REQ-004",
    itemDescription: "4K Video Editing Monitors",
    manufacturer: "LG",
    quantity: 3,
    estimatedPrice: 1200,
    department: "Marketing & Procurement",
    requestingTeam: "Digital Marketing",
    project: "Q4 Campaign",
    summary: "Dual-monitor setup for design and video rendering.",
    status: "Rejected",
    submittedDate: "2026-10-08",
  },
];

export default function DepartmentDashboard() {
  const [requests] = useState(mockRequests);
  const [selectedRequest, setSelectedRequest] = useState(null);

  // Metrics calculations
  const totalRequests = requests.length;
  const pendingCount = requests.filter(r => r.status === 'Pending').length;
  const approvedCount = requests.filter(r => r.status === 'Approved').length;
  const queriedCount = requests.filter(r => r.status === 'Queried').length;
  const rejectedCount = requests.filter(r => r.status === 'Rejected').length;

  const getStatusBadgeStyle = (status) => {
    switch (status) {
      case 'Approved': return { backgroundColor: '#e6f4ea', color: '#137333', padding: '4px 8px', borderRadius: '4px', fontSize: '12px', fontWeight: 600 };
      case 'Pending': return { backgroundColor: '#fef7e0', color: '#b06000', padding: '4px 8px', borderRadius: '4px', fontSize: '12px', fontWeight: 600 };
      case 'Queried': return { backgroundColor: '#e8f0fe', color: '#1967d2', padding: '4px 8px', borderRadius: '4px', fontSize: '12px', fontWeight: 600 };
      case 'Rejected': return { backgroundColor: '#fce8e6', color: '#c5221f', padding: '4px 8px', borderRadius: '4px', fontSize: '12px', fontWeight: 600 };
      default: return { backgroundColor: '#f1f3f4', color: '#5f6368', padding: '4px 8px', borderRadius: '4px', fontSize: '12px', fontWeight: 600 };
    }
  };

  return (
    <div style={{ padding: '32px', backgroundColor: '#f8f9fa', minHeight: '100vh', fontFamily: 'sans-serif' }}>
      {/* Header */}
      <div style={{ marginBottom: '24px' }}>
        <h1 style={{ color: '#1b6b45', margin: '0 0 8px 0' }}>Department Manager Dashboard</h1>
        <p style={{ color: '#5f6368', margin: 0 }}>Overview of departmental resource requests, spending status, and audit trails.</p>
      </div>

      {/* Summary Cards Grid */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: '16px', marginBottom: '32px' }}>
        <div style={{ background: '#fff', padding: '20px', borderRadius: '8px', boxShadow: '0 1px 3px rgba(0,0,0,0.1)' }}>
          <p style={{ margin: '0 0 8px 0', color: '#5f6368', fontSize: '14px' }}>Total Requests</p>
          <h2 style={{ margin: 0, color: '#202124' }}>{totalRequests}</h2>
        </div>
        <div style={{ background: '#fff', padding: '20px', borderRadius: '8px', boxShadow: '0 1px 3px rgba(0,0,0,0.1)' }}>
          <p style={{ margin: '0 0 8px 0', color: '#b06000', fontSize: '14px' }}>Pending</p>
          <h2 style={{ margin: 0, color: '#b06000' }}>{pendingCount}</h2>
        </div>
        <div style={{ background: '#fff', padding: '20px', borderRadius: '8px', boxShadow: '0 1px 3px rgba(0,0,0,0.1)' }}>
          <p style={{ margin: '0 0 8px 0', color: '#1967d2', fontSize: '14px' }}>Queried</p>
          <h2 style={{ margin: 0, color: '#1967d2' }}>{queriedCount}</h2>
        </div>
        <div style={{ background: '#fff', padding: '20px', borderRadius: '8px', boxShadow: '0 1px 3px rgba(0,0,0,0.1)' }}>
          <p style={{ margin: '0 0 8px 0', color: '#137333', fontSize: '14px' }}>Approved</p>
          <h2 style={{ margin: 0, color: '#137333' }}>{approvedCount}</h2>
        </div>
        <div style={{ background: '#fff', padding: '20px', borderRadius: '8px', boxShadow: '0 1px 3px rgba(0,0,0,0.1)' }}>
          <p style={{ margin: '0 0 8px 0', color: '#c5221f', fontSize: '14px' }}>Rejected</p>
          <h2 style={{ margin: 0, color: '#c5221f' }}>{rejectedCount}</h2>
        </div>
      </div>

      {/* Recent Requests Table Section */}
      <div style={{ background: '#fff', borderRadius: '8px', padding: '24px', boxShadow: '0 1px 3px rgba(0,0,0,0.1)' }}>
        <h3 style={{ marginTop: 0, marginBottom: '16px', color: '#202124' }}>Recent Departmental Requests</h3>
        <div style={{ overflowX: 'auto' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left' }}>
            <thead>
              <tr style={{ borderBottom: '2px solid #e0e0e0', color: '#5f6368', fontSize: '13px' }}>
                <th style={{ padding: '12px' }}>ID</th>
                <th style={{ padding: '12px' }}>Item Description</th>
                <th style={{ padding: '12px' }}>Department</th>
                <th style={{ padding: '12px' }}>Team</th>
                <th style={{ padding: '12px' }}>Qty</th>
                <th style={{ padding: '12px' }}>Est. Price</th>
                <th style={{ padding: '12px' }}>Status</th>
              </tr>
            </thead>
            <tbody>
              {requests.map((req) => (
                <tr 
                  key={req.id} 
                  onClick={() => setSelectedRequest(req)}
                  style={{ borderBottom: '1px solid #f1f3f4', cursor: 'pointer', transition: 'background 0.2s' }}
                  onMouseEnter={(e) => e.currentTarget.style.background = '#f8f9fa'}
                  onMouseLeave={(e) => e.currentTarget.style.background = 'transparent'}
                >
                  <td style={{ padding: '14px', fontWeight: 500, color: '#1b6b45' }}>{req.id}</td>
                  <td style={{ padding: '14px' }}>{req.itemDescription}</td>
                  <td style={{ padding: '14px' }}>{req.department}</td>
                  <td style={{ padding: '14px' }}>{req.requestingTeam}</td>
                  <td style={{ padding: '14px' }}>{req.quantity}</td>
                  <td style={{ padding: '14px' }}>${req.estimatedPrice.toLocaleString()}</td>
                  <td style={{ padding: '14px' }}><span style={getStatusBadgeStyle(req.status)}>{req.status}</span></td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Detail Modal */}
      {selectedRequest && (
        <div style={{ position: 'fixed', top: 0, left: 0, width: '100%', height: '100%', background: 'rgba(0,0,0,0.5)', display: 'flex', justifyContent: 'center', alignItems: 'center' }}>
          <div style={{ background: '#fff', padding: '32px', borderRadius: '8px', width: '600px', maxWidth: '90%', boxShadow: '0 4px 12px rgba(0,0,0,0.15)' }}>
            <h2 style={{ marginTop: 0, color: '#1b6b45' }}>Request Details: {selectedRequest.id}</h2>
            <p><strong>Item:</strong> {selectedRequest.itemDescription} ({selectedRequest.manufacturer})</p>
            <p><strong>Quantity:</strong> {selectedRequest.quantity} | <strong>Estimated Price:</strong> ${selectedRequest.estimatedPrice.toLocaleString()}</p>
            <p><strong>Department:</strong> {selectedRequest.department} / {selectedRequest.requestingTeam}</p>
            <p><strong>Project:</strong> {selectedRequest.project}</p>
            <p><strong>Summary:</strong> {selectedRequest.summary}</p>
            <p><strong>Submitted Date:</strong> {selectedRequest.submittedDate}</p>
            <div style={{ marginTop: '24px', textAlign: 'right' }}>
              <button 
                onClick={() => setSelectedRequest(null)}
                style={{ background: '#1b6b45', color: '#fff', border: 'none', padding: '8px 16px', borderRadius: '4px', cursor: 'pointer', fontWeight: 600 }}
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
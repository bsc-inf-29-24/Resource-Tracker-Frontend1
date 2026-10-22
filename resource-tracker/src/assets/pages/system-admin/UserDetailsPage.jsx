import { useParams, useNavigate } from "react-router-dom";
import { mockUsers } from "../../data/users";

export default function UserDetailsPage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const user = mockUsers.find(u => u.id === id);

  if(!user) return <div className="p-6">User not found</div>;

  return (
    <div className="p-6 max-w-2xl mx-auto">
      <button onClick={() => navigate(-1)} className="mb-4 text-blue-600">← Back</button>
      <div className="bg-white p-6 rounded shadow">
        <h1 className="text-2xl font-bold mb-4">{user.name}</h1>
        <div className="space-y-3">
          <p><strong>Email:</strong> {user.email}</p>
          <p><strong>Role:</strong> <span className="capitalize bg-blue-100 px-2 py-1 rounded">{user.role}</span></p>
          <p><strong>Department:</strong> {user.department}</p>
          <p><strong>Status:</strong> {user.status || "Active"}</p>
          <p><strong>Joined:</strong> {user.createdAt || "2024-01-01"}</p>
        </div>
        <div className="mt-6 flex gap-3">
          <button onClick={() => navigate(`/system-admin/users/${user.id}/edit`)} className="bg-blue-600 text-white px-4 py-2 rounded">Edit User</button>
        </div>
      </div>
    </div>
  );
}
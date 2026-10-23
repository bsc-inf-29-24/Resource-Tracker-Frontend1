import { useState, useMemo } from "react";
import { useNavigate } from "react-router-dom";
import FilterToolbar from "../../components/filters/filterToolbar";
import { mockUsers } from "../../data/users"; // change to your data file path

export default function UserManagementPage() {
  const navigate = useNavigate();
  const [users, setUsers] = useState(mockUsers);
  const [search, setSearch] = useState("");
  const [roleFilter, setRoleFilter] = useState("all");

  const filtered = useMemo(() => {
    return users.filter(u => {
      const matchesSearch = u.name.toLowerCase().includes(search.toLowerCase()) || u.email.toLowerCase().includes(search.toLowerCase());
      const matchesRole = roleFilter === "all" || u.role === roleFilter;
      return matchesSearch && matchesRole;
    });
  }, [users, search, roleFilter]);

  const handleDelete = (id) => {
    if (!window.confirm("Delete this user?")) return;
    setUsers(prev => prev.filter(u => u.id !== id));
  };

  return (
    <div className="p-6">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold">User Management</h1>
        <button onClick={() => navigate("/system-admin/users/create")} className="bg-blue-600 text-white px-4 py-2 rounded">
          + Create User
        </button>
      </div>

      <FilterToolbar 
        searchValue={search} 
        onSearchChange={setSearch}
        roleFilter={roleFilter}
        onRoleChange={setRoleFilter}
      />

      <div className="mt-4 bg-white rounded shadow overflow-auto">
        <table className="w-full text-left">
          <thead className="bg-gray-100">
            <tr>
              <th className="p-3">Name</th>
              <th className="p-3">Email</th>
              <th className="p-3">Role</th>
              <th className="p-3">Department</th>
              <th className="p-3">Actions</th>
            </tr>
          </thead>
          <tbody>
            {filtered.map(user => (
              <tr key={user.id} className="border-t hover:bg-gray-50">
                <td className="p-3">{user.name}</td>
                <td className="p-3">{user.email}</td>
                <td className="p-3 capitalize">{user.role}</td>
                <td className="p-3">{user.department}</td>
                <td className="p-3 flex gap-2">
                  <button onClick={() => navigate(`/system-admin/users/${user.id}`)} className="text-blue-600">View</button>
                  <button onClick={() => navigate(`/system-admin/users/${user.id}/edit`)} className="text-green-600">Edit</button>
                  <button onClick={() => handleDelete(user.id)} className="text-red-600">Delete</button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
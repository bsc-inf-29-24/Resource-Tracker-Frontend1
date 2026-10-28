import { useState, useEffect } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { mockUsers } from "../../data/users";

export default function EditUserPage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [form, setForm] = useState(null);

  useEffect(() => {
    const user = mockUsers.find(u => u.id === id);
    if(user) setForm(user);
  }, [id]);

  if(!form) return <div className="p-6">Loading user...</div>;

  const handleChange = (e) => setForm({...form, [e.target.name]: e.target.value});

  const handleSubmit = (e) => {
    e.preventDefault();
    // TODO: PUT /api/users/:id
    console.log("Updating user:", form);
    alert("User updated!");
    navigate("/system-admin/users");
  };

  return (
    <div className="p-6 max-w-2xl mx-auto">
      <h1 className="text-2xl font-bold mb-6">Edit User - {form.name}</h1>
      <form onSubmit={handleSubmit} className="bg-white p-6 rounded shadow space-y-4">
        <input name="name" value={form.name} onChange={handleChange} required className="w-full border p-2 rounded"/>
        <input name="email" value={form.email} onChange={handleChange} required className="w-full border p-2 rounded"/>
        <input name="department" value={form.department} onChange={handleChange} required className="w-full border p-2 rounded"/>
        <select name="role" value={form.role} onChange={handleChange} className="w-full border p-2 rounded">
          <option value="SYSTEM_ADMIN">System Admin</option>
          <option value="DEPARTMENT_MANAGER">Department Manager</option>
          <option value="LINE_MANAGER">Line Manager</option>
          <option value="TEAM_LEAD">Team Lead</option>
        </select>
        <div className="flex gap-3">
          <button type="submit" className="bg-green-600 text-white px-6 py-2 rounded">Save Changes</button>
          <button type="button" onClick={() => navigate(-1)} className="bg-gray-200 px-6 py-2 rounded">Cancel</button>
        </div>
      </form>
    </div>
  );
}
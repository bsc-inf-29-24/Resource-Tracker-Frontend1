import { useState } from "react";
import { useNavigate } from "react-router-dom";

export default function CreateUserPage() {
  const navigate = useNavigate();
  const [form, setForm] = useState({
    name: "", email: "", role: "team-lead", department: "", password: ""
  });

  const handleChange = (e) => setForm({...form, [e.target.name]: e.target.value});

  const handleSubmit = (e) => {
    e.preventDefault();
    // TODO: Replace with your API call: POST /api/users
    const newUser = { id: Date.now().toString(), ...form };
    const existing = JSON.parse(localStorage.getItem("rt_users") || "[]");
    localStorage.setItem("rt_users", JSON.stringify([...existing, newUser]));
    
    console.log("Creating user:", form);
    alert("User created!");
    navigate("/system-admin/users");
  };

  return (
    <div className="p-6 max-w-2xl mx-auto">
      <h1 className="text-2xl font-bold mb-6">Create New User</h1>
      <form onSubmit={handleSubmit} className="bg-white p-6 rounded shadow space-y-4">
        <input name="name" value={form.name} onChange={handleChange} placeholder="Full Name" required className="w-full border p-2 rounded"/>
        <input name="email" value={form.email} onChange={handleChange} type="email" placeholder="Email" required className="w-full border p-2 rounded"/>
        <input name="department" value={form.department} onChange={handleChange} placeholder="Department" required className="w-full border p-2 rounded"/>
        <select name="role" value={form.role} onChange={handleChange} className="w-full border p-2 rounded">
          <option value="system-admin">System Admin</option>
          <option value="department-manager">Department Manager</option>
          <option value="line-manager">Line Manager</option>
          <option value="team-lead">Team Lead</option>
        </select>
        <input name="password" value={form.password} onChange={handleChange} type="password" placeholder="Temporary Password" required className="w-full border p-2 rounded"/>
        <div className="flex gap-3">
          <button type="submit" className="bg-blue-600 text-white px-6 py-2 rounded">Create</button>
          <button type="button" onClick={() => navigate(-1)} className="bg-gray-200 px-6 py-2 rounded">Cancel</button>
        </div>
      </form>
    </div>
  );
}
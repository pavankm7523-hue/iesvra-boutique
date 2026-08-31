import { createFileRoute, Link } from "@tanstack/react-router";
import { useState, useEffect } from "react";
import { ShieldCheck, Plus, Trash2, ArrowLeft } from "lucide-react";
import { toast } from "sonner";

export const Route = createFileRoute("/admin/users")({
  component: UsersManagement,
});

function UsersManagement() {
  const [users, setUsers] = useState([
    { email: "ishvaraindiaa@gmail.com", role: "Super Admin", date: "2024-05-10" }
  ]);
  const [newEmail, setNewEmail] = useState("");

  useEffect(() => {
    const saved = localStorage.getItem("IESVRA_admin_users");
    if (saved) {
      setUsers(JSON.parse(saved));
    }
  }, []);

  const handleInvite = () => {
    if (!newEmail || !newEmail.includes("@")) {
      toast.error("Please enter a valid email address");
      return;
    }
    if (users.find(u => u.email === newEmail)) {
      toast.error("User is already an admin");
      return;
    }
    
    const updated = [...users, { email: newEmail, role: "Admin", date: new Date().toISOString().split("T")[0] }];
    setUsers(updated);
    localStorage.setItem("IESVRA_admin_users", JSON.stringify(updated));
    setNewEmail("");
    toast.success(`Invitation sent to ${newEmail}`);
  };

  const handleRemove = (email: string) => {
    if (email === "ishvaraindiaa@gmail.com") {
      toast.error("Cannot remove the primary Super Admin");
      return;
    }
    if (confirm(`Remove admin access for ${email}?`)) {
      const updated = users.filter(u => u.email !== email);
      setUsers(updated);
      localStorage.setItem("IESVRA_admin_users", JSON.stringify(updated));
      toast.success("Admin removed successfully");
    }
  };

  return (
    <div className="space-y-8 max-w-4xl mx-auto">
      <div>
        <Link to="/admin" className="inline-flex items-center gap-2 text-navy-deep/60 hover:text-gold mb-4 transition-colors font-medium text-sm">
          <ArrowLeft className="h-4 w-4" /> Back to Dashboard
        </Link>
        <h2 className="text-3xl font-display font-bold text-navy-deep flex items-center gap-3">
          <ShieldCheck className="h-8 w-8 text-gold" /> Admin users & permission
        </h2>
        <p className="text-navy-deep/60 mt-1">Manage staff roles, access levels, and security for your store.</p>
      </div>
      
      <div className="bg-white rounded-xl shadow-sm border border-border/50 p-6">
        <h3 className="font-bold text-navy-deep text-lg mb-4">Invite New Admin</h3>
        <div className="flex gap-4">
          <input 
            type="email" 
            value={newEmail} 
            onChange={e => setNewEmail(e.target.value)} 
            placeholder="Enter staff email address"
            className="flex-1 border border-border/50 rounded-md px-4 py-2 focus:outline-none focus:border-gold focus:ring-1 focus:ring-gold" 
          />
          <button 
            onClick={handleInvite}
            className="flex items-center gap-2 bg-gold text-navy-deep px-6 py-2 rounded-md font-bold text-sm tracking-wide hover:bg-gold/90 transition-colors shadow-sm whitespace-nowrap"
          >
            <Plus className="h-4 w-4" /> Send Invite
          </button>
        </div>
      </div>

      <div className="bg-white rounded-xl shadow-sm border border-border/50 overflow-hidden">
        <table className="w-full text-left border-collapse">
          <thead>
            <tr className="bg-secondary/20 border-b border-border/50">
              <th className="p-4 font-semibold text-sm uppercase tracking-wider text-navy-deep/70">User Email</th>
              <th className="p-4 font-semibold text-sm uppercase tracking-wider text-navy-deep/70">Role</th>
              <th className="p-4 font-semibold text-sm uppercase tracking-wider text-navy-deep/70">Date Added</th>
              <th className="p-4 font-semibold text-sm uppercase tracking-wider text-navy-deep/70 text-right">Actions</th>
            </tr>
          </thead>
          <tbody>
            {users.map((user, idx) => (
              <tr key={idx} className="border-b border-border/50 last:border-0 hover:bg-secondary/5 transition-colors">
                <td className="p-4 font-medium text-navy-deep">{user.email}</td>
                <td className="p-4">
                  <span className={`inline-block px-2 py-1 rounded text-xs font-bold ${user.role === 'Super Admin' ? 'bg-gold/20 text-gold-dark' : 'bg-blue-100 text-blue-800'}`}>
                    {user.role}
                  </span>
                </td>
                <td className="p-4 text-navy-deep/60">{user.date}</td>
                <td className="p-4 text-right">
                  <button
                    onClick={() => handleRemove(user.email)}
                    disabled={user.email === "ishvaraindiaa@gmail.com"}
                    className="p-2 text-navy-deep/40 hover:text-red-500 rounded-md transition-colors disabled:opacity-30 disabled:hover:text-navy-deep/40"
                    title="Remove User"
                  >
                    <Trash2 className="h-4 w-4" />
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

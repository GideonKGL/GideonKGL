import { useEffect, useState } from "react";
import { api } from "../api/client";

type User = {
  id: string;
  email: string;
  firstName: string;
  lastName: string;
  phone?: string;
  isActive: boolean;
  roles: { role: { name: string } }[];
};

export function Users() {
  const [users, setUsers] = useState<User[]>([]);

  useEffect(() => {
    api<User[]>("/users").then(setUsers).catch(console.error);
  }, []);

  return (
    <section>
      <h2>User Management</h2>
      <div className="card table-card">
        <table>
          <thead>
            <tr>
              <th>Name</th>
              <th>Email</th>
              <th>Phone</th>
              <th>Roles</th>
              <th>Status</th>
            </tr>
          </thead>
          <tbody>
            {users.map((user) => (
              <tr key={user.id}>
                <td>{user.firstName} {user.lastName}</td>
                <td>{user.email}</td>
                <td>{user.phone ?? "-"}</td>
                <td>{user.roles.map((role) => role.role.name).join(", ")}</td>
                <td>{user.isActive ? "Active" : "Inactive"}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </section>
  );
}

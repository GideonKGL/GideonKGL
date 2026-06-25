import { NavLink, Outlet, useNavigate } from "react-router-dom";
import { tokenStore } from "../api/client";

const nav = [
  ["Dashboard", "/"],
  ["Users", "/users"],
  ["Devices", "/devices"],
  ["Live Map", "/tracking"],
  ["SOS Alerts", "/alerts"],
  ["History", "/history"],
  ["Reports", "/reports"]
];

export function Layout() {
  const navigate = useNavigate();
  const user = tokenStore.user();

  return (
    <div className="shell">
      <aside className="sidebar">
        <h1>Guardian Tracker</h1>
        <p>Securitatem Defensionis</p>
        <nav>
          {nav.map(([label, to]) => (
            <NavLink key={to} to={to} className={({ isActive }) => (isActive ? "active" : "")}>
              {label}
            </NavLink>
          ))}
        </nav>
      </aside>
      <main>
        <header className="topbar">
          <span>{user?.email}</span>
          <button
            onClick={() => {
              tokenStore.clear();
              navigate("/login");
            }}
          >
            Logout
          </button>
        </header>
        <Outlet />
      </main>
    </div>
  );
}

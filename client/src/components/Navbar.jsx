import { Link, useNavigate } from "react-router-dom";

import { useAuth } from "../context/AuthContext";

// function getInitials(user) {
//   const label = user?.username || user?.email || "User";
//   const parts = label
//     .replace(/@.*/, "")
//     .split(/[\s._-]+/)
//     .filter(Boolean);

//   if (parts.length >= 2) {
//     return `${parts[0][0]}${parts[1][0]}`.toUpperCase();
//   }

//   return label.slice(0, 2).toUpperCase();
// }

function Navbar() {
  const navigate = useNavigate();
  const { user, logout } = useAuth();

  const handleLogout = () => {
    logout();
    navigate("/");
  };

  return (
    <header className="navbar">
      <Link
        to="/dashboard"
        className="navbar__brand"
        aria-label="Planora dashboard"
      >
        <span>Planora</span>
      </Link>

      <nav className="navbar__links" aria-label="Main navigation">
        <Link to="/dashboard">Dashboard</Link>
        <Link to="/org/new">Create Organization</Link>
      </nav>

      <div className="navbar__actions">
        {user && (
          <div className="navbar__profile" title={user.username || user.email}>
            <span className="navbar__user">{user.username || user.email}</span>
          </div>
        )}

        <button type="button" className="navbar__logout" onClick={handleLogout}>
          Logout
        </button>
      </div>
    </header>
  );
}

export default Navbar;

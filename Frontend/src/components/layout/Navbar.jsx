import useAuth from "../../hooks/useAuth";
import { getInitials } from "../../utils/helpers";
import { formatRole } from "../../utils/formatters";

function Navbar({ onMenuClick }) {
  const { user } = useAuth();

  const userName = user?.name || user?.email || "User";
  const userRole = formatRole(user?.role);

  return (
    <header className="app-navbar">
      <div className="navbar-left">
        <button
          type="button"
          className="mobile-menu-button"
          onClick={onMenuClick}
          aria-label="Open navigation"
        >
          ☰
        </button>

        <div className="navbar-brand">
          <img
            src="/logo/intelliland-logo.png"
            alt="IntelliLandAI"
            className="navbar-logo"
          />
        </div>
      </div>

      <div className="navbar-right">
        <div className="navbar-user">
          <div className="navbar-user-avatar">
            {getInitials(userName)}
          </div>

          <div className="navbar-user-info">
            <span className="navbar-user-name">
              {userName}
            </span>

            <span className="navbar-user-role">
              {userRole}
            </span>
          </div>
        </div>
      </div>
    </header>
  );
}

export default Navbar;
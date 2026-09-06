import { NavLink } from "react-router-dom";

import useAuth from "../../hooks/useAuth";
import { USER_ROLES } from "../../utils/constants";

function Sidebar({ isOpen, onClose }) {
  const { user, logout } = useAuth();

  const role = user?.role;

  const navigationItems = [
    {
      label: "Dashboard",
      path: "/dashboard",
      icon: "▦",
      roles: [
        USER_ROLES.ADMIN,
        USER_ROLES.OFFICER,
        USER_ROLES.VERIFIER,
        USER_ROLES.VIEWER,
      ],
    },
    {
      label: "Documents",
      path: "/documents",
      icon: "▤",
      roles: [
        USER_ROLES.ADMIN,
        USER_ROLES.OFFICER,
        USER_ROLES.VERIFIER,
        USER_ROLES.VIEWER,
      ],
    },
    {
      label: "Validation Review",
      path: "/validation",
      icon: "✓",
      roles: [
        USER_ROLES.ADMIN,
        USER_ROLES.OFFICER,
        USER_ROLES.VERIFIER,
      ],
    },
    {
      label: "GIS Map",
      path: "/gis",
      icon: "⌖",
      roles: [
        USER_ROLES.ADMIN,
        USER_ROLES.OFFICER,
        USER_ROLES.VERIFIER,
        USER_ROLES.VIEWER,
      ],
    },
    {
      label: "Audit History",
      path: "/audit",
      icon: "◷",
      roles: [
        USER_ROLES.ADMIN,
        USER_ROLES.OFFICER,
        USER_ROLES.VERIFIER,
      ],
    },
  ];

  const visibleItems = navigationItems.filter((item) =>
    item.roles.includes(role)
  );

  const handleLogout = () => {
    onClose?.();
    logout();
  };

  return (
    <>
      {isOpen && (
        <div
          className="sidebar-overlay"
          onClick={onClose}
          aria-hidden="true"
        />
      )}

      <aside
        className={`app-sidebar ${
          isOpen ? "sidebar-open" : ""
        }`}
      >
        {/* Brand */}
        <div className="sidebar-brand">
          <img
            src="/logo/intelliland-logo.png"
            alt="IntelliLandAI"
            className="sidebar-logo"
          />

          <button
            type="button"
            className="sidebar-close-button"
            onClick={onClose}
            aria-label="Close navigation"
          >
            ×
          </button>
        </div>

        {/* Workspace label */}
        <div className="sidebar-section-label">
          WORKSPACE
        </div>

        {/* Navigation */}
        <nav
          className="sidebar-navigation"
          aria-label="Main navigation"
        >
          {visibleItems.map((item) => (
            <NavLink
              key={item.path}
              to={item.path}
              onClick={onClose}
              className={({ isActive }) =>
                `sidebar-nav-item ${
                  isActive
                    ? "sidebar-nav-item-active"
                    : ""
                }`
              }
            >
              <span
                className="sidebar-nav-icon"
                aria-hidden="true"
              >
                {item.icon}
              </span>

              <span>{item.label}</span>
            </NavLink>
          ))}
        </nav>

        {/* Bottom section */}
        <div className="sidebar-bottom">
          <div className="sidebar-system-status">
            <span
              className="status-dot"
              aria-hidden="true"
            />

            <div>
              <strong>System</strong>
              <span>Operational</span>
            </div>
          </div>

          <button
            type="button"
            className="sidebar-logout"
            onClick={handleLogout}
          >
            <span
              className="sidebar-nav-icon"
              aria-hidden="true"
            >
              ↪
            </span>

            <span>Logout</span>
          </button>
        </div>
      </aside>
    </>
  );
}

export default Sidebar;
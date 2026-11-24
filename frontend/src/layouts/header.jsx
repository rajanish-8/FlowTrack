import { useState, useEffect } from "react";
import logoAsset from "../assets/flowtrack-logo.svg";
import defaultAvatar from "../assets/default-avatar.svg";
import NotificationBell from "../components/NotificationBell";

function Header({
  userData,
  userRole,
  tasks = [],
  onViewTask,
  onQuickAddTask,
  onOpenAICopilot,
  onOpenShortcuts,
  projects = [],
  selectedProject,
  onProjectChange,
}) {
  // ── Theme ──────────────────────────────────────────
  const [theme, setTheme] = useState(() => {
    return localStorage.getItem("flowtrack_theme") || "dark";
  });

  useEffect(() => {
    // Apply via CSS class on <body> as well as data-theme attribute
    document.body.classList.remove("light", "dark");
    document.body.classList.add(theme);
    document.documentElement.setAttribute("data-theme", theme);
    localStorage.setItem("flowtrack_theme", theme);
  }, [theme]);

  const toggleTheme = () => setTheme((prev) => (prev === "dark" ? "light" : "dark"));

  // ── Mobile hamburger ───────────────────────────────
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [showRoleSwitcher, setShowRoleSwitcher] = useState(false);

  const roleLabel = {
    owner: "Organization Owner",
    manager: "Manager",
    member: "Member",
  }[userRole] || "Workspace";

  const handleLogout = () => {
    localStorage.removeItem("token");
    window.location.href = "/login";
  };

  const handleRoleSwitch = (targetToken) => {
    localStorage.setItem("token", targetToken);
    window.location.reload();
  };

  return (
    <header className="clay-card app-titlebar header-root">
      {/* ── Top Row ───────────────────────────────────── */}
      <div className="header-top-row">
        {/* Left: Traffic Lights + Brand */}
        <div className="header-left">
          {/* macOS-style Traffic Light Dots */}
          <div className="header-traffic-lights">
            <span className="tl-dot tl-red" title="FlowTrack App Window" />
            <span className="tl-dot tl-yellow" title="Minimize" />
            <span className="tl-dot tl-green" title="Full Screen" />
          </div>

          {/* Brand */}
          <div className="header-brand">
            <div className="header-logo-box">
              <img src={logoAsset} alt="FlowTrack" style={{ width: "18px", height: "18px", filter: "brightness(0) invert(1)" }} />
            </div>
            <h1 className="gradient-text header-brand-name">FlowTrack</h1>
            <span className="header-badge-pro">PRO v2.0</span>
            <span className="header-badge-active">● Active</span>
          </div>

          {/* Project Selector */}
          {projects.length > 0 && (
            <div className="header-project-select-wrap">
              <select
                value={selectedProject?.id || ""}
                onChange={(e) => {
                  const found = projects.find((p) => String(p.id) === e.target.value);
                  if (found && onProjectChange) onProjectChange(found);
                }}
                className="header-project-select"
              >
                {projects.map((p) => (
                  <option key={p.id} value={p.id}>📁 {p.name}</option>
                ))}
              </select>
            </div>
          )}
        </div>

        {/* Right: Controls (desktop) */}
        <div className="header-right header-right-desktop">
          <HeaderControls
            onQuickAddTask={onQuickAddTask}
            onOpenAICopilot={onOpenAICopilot}
            onOpenShortcuts={onOpenShortcuts}
            theme={theme}
            toggleTheme={toggleTheme}
            tasks={tasks}
            onViewTask={onViewTask}
            userData={userData}
            roleLabel={roleLabel}
            showRoleSwitcher={showRoleSwitcher}
            setShowRoleSwitcher={setShowRoleSwitcher}
            userRole={userRole}
            handleRoleSwitch={handleRoleSwitch}
            handleLogout={handleLogout}
          />
        </div>

        {/* Hamburger (mobile) */}
        <button
          className="header-hamburger"
          onClick={() => setMobileMenuOpen((p) => !p)}
          aria-label="Toggle menu"
        >
          {mobileMenuOpen ? "✕" : "☰"}
        </button>
      </div>

      {/* ── Mobile Dropdown Menu ──────────────────────── */}
      {mobileMenuOpen && (
        <div className="header-mobile-menu">
          <HeaderControls
            onQuickAddTask={onQuickAddTask}
            onOpenAICopilot={onOpenAICopilot}
            onOpenShortcuts={onOpenShortcuts}
            theme={theme}
            toggleTheme={toggleTheme}
            tasks={tasks}
            onViewTask={onViewTask}
            userData={userData}
            roleLabel={roleLabel}
            showRoleSwitcher={showRoleSwitcher}
            setShowRoleSwitcher={setShowRoleSwitcher}
            userRole={userRole}
            handleRoleSwitch={handleRoleSwitch}
            handleLogout={handleLogout}
            isMobile
          />
        </div>
      )}
    </header>
  );
}

/* ── Shared controls rendered in both desktop & mobile ─── */
function HeaderControls({
  onQuickAddTask, onOpenAICopilot, onOpenShortcuts,
  theme, toggleTheme,
  tasks, onViewTask,
  userData, roleLabel, showRoleSwitcher, setShowRoleSwitcher,
  userRole, handleRoleSwitch, handleLogout,
  isMobile = false,
}) {
  return (
    <div className={isMobile ? "header-controls-mobile" : "header-controls"}>
      {onQuickAddTask && (
        <button onClick={onQuickAddTask} className="hdr-btn hdr-btn-task" title="Create a new task quickly (Press C)">
          <span>+ Task</span>
          {!isMobile && <kbd className="hdr-kbd">C</kbd>}
        </button>
      )}

      {onOpenAICopilot && (
        <button onClick={onOpenAICopilot} className="hdr-btn hdr-btn-ai">
          ✨ {isMobile ? "AI" : "AI Copilot"}
        </button>
      )}

      {/* Theme Toggle — pill button sun/moon */}
      <button
        onClick={toggleTheme}
        title={`Switch to ${theme === "dark" ? "Light" : "Dark"} Mode (Press D)`}
        className="hdr-btn hdr-btn-theme"
      >
        {theme === "dark" ? "☀️" : "🌙"}
        {!isMobile && <span>{theme === "dark" ? " Light" : " Dark"}</span>}
      </button>

      {onOpenShortcuts && (
        <button onClick={onOpenShortcuts} title="View Keyboard Shortcuts (Press ?)" className="hdr-btn hdr-btn-icon">
          ⌨️
        </button>
      )}

      <NotificationBell tasks={tasks} onViewTask={onViewTask} />

      {/* User profile + role switcher */}
      <div style={{ position: "relative" }}>
        <div
          onClick={() => setShowRoleSwitcher((prev) => !prev)}
          className="hdr-user-pill"
          title="Click to switch demo role / account"
        >
          <span className="hdr-role-badge">👑 {isMobile ? userRole : roleLabel}</span>
          <img
            src={userData?.profile_picture || "/src/assets/default-avatar.svg"}
            alt=""
            style={{ width: "22px", height: "22px", borderRadius: "50%", objectFit: "cover" }}
          />
          {!isMobile && (
            <span style={{ fontSize: "0.78rem", fontWeight: 700, color: "var(--text)" }}>
              {userData?.username || "You"}
            </span>
          )}
          <span style={{ fontSize: "0.65rem", color: "var(--text-muted)" }}>▾</span>
        </div>

        {showRoleSwitcher && (
          <div className="hdr-dropdown">
            <div className="hdr-dropdown-title">Switch Account / Role</div>
            {[
              { token: "bf9fb055e83214149c1e258d64ebe07451663dc6", label: "👑 Organization Owner", sub: "flowtrack@gmail.com", role: "owner" },
              { token: "685aa40e77e49ca65144197300e1173d33e3c9a6", label: "💼 Project Manager", sub: "manager@flowtrack.test", role: "manager" },
              { token: "385ed8554899444effbb3b45185612873c2b6066", label: "👤 Developer Member", sub: "member@flowtrack.test", role: "member" },
            ].map((acc) => (
              <button
                key={acc.role}
                onClick={() => handleRoleSwitch(acc.token)}
                className="hdr-dropdown-item"
                style={{ background: userRole === acc.role ? "var(--bg)" : "transparent" }}
              >
                {acc.label}
                <small style={{ color: "var(--text-muted)", display: "block" }}>{acc.sub}</small>
              </button>
            ))}
            <div style={{ borderTop: "1px solid var(--border)", margin: "4px 0" }} />
            <button onClick={handleLogout} className="hdr-dropdown-item hdr-dropdown-logout">
              🚪 Logout to Sign In
            </button>
          </div>
        )}
      </div>
    </div>
  );
}

export default Header;

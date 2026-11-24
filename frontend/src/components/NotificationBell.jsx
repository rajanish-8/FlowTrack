import { useState, useEffect, useRef, useCallback } from "react";
import { API_BASE_URL } from "../utils/api";

const FALLBACK_NOTIFICATIONS = [
  {
    id: "fallback-1",
    type: "task",
    message: "You have been assigned a new task: \"Design homepage mockup\"",
    is_read: false,
    created_at: new Date(Date.now() - 1000 * 60 * 15).toISOString(), // 15m ago
  },
  {
    id: "fallback-2",
    type: "comment",
    message: "Alex commented on \"API integration task\": Looks good, please review.",
    is_read: false,
    created_at: new Date(Date.now() - 1000 * 60 * 60).toISOString(), // 1h ago
  },
  {
    id: "fallback-3",
    type: "due",
    message: "Task \"Submit quarterly report\" is due in 24 hours.",
    is_read: true,
    created_at: new Date(Date.now() - 1000 * 60 * 60 * 3).toISOString(), // 3h ago
  },
];

const TYPE_ICON = {
  task: "📋",
  comment: "💬",
  due: "⚠️",
  overdue: "⚠️",
  assigned: "📋",
  default: "🔔",
};

function timeAgo(isoString) {
  if (!isoString) return "";
  try {
    const diff = Math.floor((Date.now() - new Date(isoString).getTime()) / 1000);
    if (diff < 60) return `${diff}s ago`;
    if (diff < 3600) return `${Math.floor(diff / 60)}m ago`;
    if (diff < 86400) return `${Math.floor(diff / 3600)}h ago`;
    return `${Math.floor(diff / 86400)}d ago`;
  } catch {
    return "";
  }
}

function NotificationBell({ tasks = [], onViewTask }) {
  const [isOpen, setIsOpen] = useState(false);
  const [notifications, setNotifications] = useState([]);
  const [usingFallback, setUsingFallback] = useState(false);
  const dropdownRef = useRef(null);
  const intervalRef = useRef(null);

  // ── Fetch from API ──────────────────────────────────────────────────────────
  const fetchNotifications = useCallback(async () => {
    const token = localStorage.getItem("token");
    if (!token) return;

    try {
      const res = await fetch(`${API_BASE_URL}/api/notifications/`, {
        headers: {
          Authorization: `Token ${token}`,
          "Content-Type": "application/json",
        },
      });

      if (!res.ok) {
        throw new Error(`HTTP ${res.status}`);
      }

      const data = await res.json();
      // Support both paginated { results: [...] } and plain array
      const list = Array.isArray(data) ? data : (data.results || []);
      setNotifications(list);
      setUsingFallback(false);
    } catch {
      // Backend not ready yet — use fallback so UI still works
      if (notifications.length === 0) {
        setNotifications(FALLBACK_NOTIFICATIONS);
        setUsingFallback(true);
      }
    }
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  // ── Poll every 30 seconds ───────────────────────────────────────────────────
  useEffect(() => {
    fetchNotifications();
    intervalRef.current = setInterval(fetchNotifications, 30_000);
    return () => clearInterval(intervalRef.current);
  }, [fetchNotifications]);

  // ── Close on outside click ──────────────────────────────────────────────────
  useEffect(() => {
    const handleClickOutside = (e) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target)) {
        setIsOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  // ── Derived state ───────────────────────────────────────────────────────────
  const unreadCount = notifications.filter((n) => !n.is_read).length;

  // ── Mark single notification read ───────────────────────────────────────────
  const handleNotificationClick = async (n) => {
    if (n.is_read) return;

    // Optimistic update
    setNotifications((prev) =>
      prev.map((x) => (x.id === n.id ? { ...x, is_read: true } : x))
    );

    if (!usingFallback) {
      try {
        const token = localStorage.getItem("token");
        await fetch(`${API_BASE_URL}/api/notifications/${n.id}/read/`, {
          method: "PATCH",
          headers: {
            Authorization: `Token ${token}`,
            "Content-Type": "application/json",
          },
        });
      } catch {
        // Revert on failure
        setNotifications((prev) =>
          prev.map((x) => (x.id === n.id ? { ...x, is_read: false } : x))
        );
      }
    }

    // If the notification links to a task, navigate there
    if (onViewTask && n.related_task) {
      onViewTask(n.related_task);
      setIsOpen(false);
    }
  };

  // ── Mark all read ────────────────────────────────────────────────────────────
  const handleMarkAllRead = async () => {
    setNotifications((prev) => prev.map((n) => ({ ...n, is_read: true })));

    if (!usingFallback) {
      try {
        const token = localStorage.getItem("token");
        await fetch(`${API_BASE_URL}/api/notifications/mark-all-read/`, {
          method: "POST",
          headers: {
            Authorization: `Token ${token}`,
            "Content-Type": "application/json",
          },
        });
      } catch {
        // Silently ignore — optimistic already applied
      }
    }
  };

  // ── Render ───────────────────────────────────────────────────────────────────
  return (
    <div style={{ position: "relative" }} ref={dropdownRef}>
      {/* Bell button */}
      <button
        onClick={() => setIsOpen((prev) => !prev)}
        style={{
          position: "relative",
          background: "var(--bg)",
          border: "1px solid var(--border)",
          borderRadius: "50%",
          width: "36px",
          height: "36px",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          cursor: "pointer",
          fontSize: "1rem",
          transition: "transform 0.15s ease",
        }}
        title="Notifications"
        aria-label="Notifications"
      >
        🔔
        {unreadCount > 0 && (
          <span
            style={{
              position: "absolute",
              top: "-4px",
              right: "-4px",
              background: "#ef4444",
              color: "#fff",
              fontSize: "0.68rem",
              fontWeight: 800,
              width: "18px",
              height: "18px",
              borderRadius: "50%",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              border: "2px solid var(--panel)",
            }}
          >
            {unreadCount > 9 ? "9+" : unreadCount}
          </span>
        )}
      </button>

      {/* Dropdown panel */}
      {isOpen && (
        <div
          className="clay-card"
          style={{
            position: "absolute",
            right: 0,
            top: "44px",
            width: "340px",
            maxWidth: "92vw",
            background: "var(--panel)",
            border: "1px solid var(--border)",
            borderRadius: "16px",
            boxShadow: "var(--shadow-soft, 0 10px 25px rgba(0,0,0,0.18))",
            zIndex: 1100,
            overflow: "hidden",
          }}
        >
          {/* Header row */}
          <div
            style={{
              padding: "12px 16px",
              borderBottom: "1px solid var(--border)",
              display: "flex",
              justifyContent: "space-between",
              alignItems: "center",
            }}
          >
            <div>
              <strong style={{ fontSize: "0.9rem", color: "var(--text)" }}>
                Notifications
              </strong>
              <span
                style={{
                  fontSize: "0.75rem",
                  color: "var(--text-muted)",
                  marginLeft: "6px",
                }}
              >
                ({unreadCount} unread)
              </span>
              {usingFallback && (
                <span
                  style={{
                    fontSize: "0.68rem",
                    color: "var(--text-muted)",
                    marginLeft: "6px",
                    opacity: 0.6,
                  }}
                  title="Backend API not yet connected — showing demo notifications"
                >
                  · demo
                </span>
              )}
            </div>
            {unreadCount > 0 && (
              <button
                onClick={handleMarkAllRead}
                style={{
                  background: "none",
                  border: "none",
                  color: "var(--brand, #6366f1)",
                  fontSize: "0.74rem",
                  fontWeight: 600,
                  cursor: "pointer",
                  padding: "2px 6px",
                  borderRadius: "6px",
                }}
              >
                Mark all read
              </button>
            )}
          </div>

          {/* Notification list */}
          <div style={{ maxHeight: "400px", overflowY: "auto" }}>
            {notifications.length === 0 ? (
              <div
                style={{
                  padding: "36px 16px",
                  textAlign: "center",
                  color: "var(--text-muted)",
                  fontSize: "0.85rem",
                }}
              >
                <div style={{ fontSize: "1.5rem", marginBottom: "8px" }}>✓</div>
                You're all caught up!
              </div>
            ) : (
              notifications.map((n) => {
                const icon =
                  TYPE_ICON[n.type] || TYPE_ICON.default;
                return (
                  <div
                    key={n.id}
                    onClick={() => handleNotificationClick(n)}
                    style={{
                      padding: "10px 14px",
                      borderBottom: "1px solid var(--border)",
                      cursor: n.is_read ? "default" : "pointer",
                      background: n.is_read
                        ? "transparent"
                        : "rgba(99, 102, 241, 0.05)",
                      display: "flex",
                      gap: "10px",
                      alignItems: "flex-start",
                      transition: "background 0.15s",
                    }}
                    onMouseEnter={(e) => {
                      if (!n.is_read)
                        e.currentTarget.style.background =
                          "rgba(99, 102, 241, 0.1)";
                    }}
                    onMouseLeave={(e) => {
                      e.currentTarget.style.background = n.is_read
                        ? "transparent"
                        : "rgba(99, 102, 241, 0.05)";
                    }}
                  >
                    <span
                      style={{
                        fontSize: "1.1rem",
                        flexShrink: 0,
                        marginTop: "2px",
                      }}
                    >
                      {icon}
                    </span>
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div
                        style={{
                          display: "flex",
                          justifyContent: "space-between",
                          alignItems: "center",
                          gap: "6px",
                        }}
                      >
                        {!n.is_read && (
                          <span
                            style={{
                              width: "7px",
                              height: "7px",
                              borderRadius: "50%",
                              background: "#6366f1",
                              flexShrink: 0,
                            }}
                          />
                        )}
                        <span
                          style={{
                            fontSize: "0.7rem",
                            color: "var(--text-muted)",
                            flexShrink: 0,
                            marginLeft: "auto",
                          }}
                        >
                          {timeAgo(n.created_at)}
                        </span>
                      </div>
                      <p
                        style={{
                          margin: "3px 0 0 0",
                          fontSize: "0.8rem",
                          color: "var(--text)",
                          lineHeight: 1.4,
                          wordBreak: "break-word",
                        }}
                      >
                        {n.message}
                      </p>
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </div>
      )}
    </div>
  );
}

export default NotificationBell;

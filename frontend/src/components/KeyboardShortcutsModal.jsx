function KeyboardShortcutsModal({ onClose }) {
  const shortcuts = [
    { key: "C", description: "Create a new task quickly" },
    { key: "F or /", description: "Focus search bar" },
    { key: "B", description: "Switch to 📌 Kanban Board tab" },
    { key: "M", description: "Switch to 📅 Month Calendar tab" },
    { key: "T", description: "Switch to 📋 Table Register tab" },
    { key: "E", description: "Switch to 🎯 Eisenhower Matrix tab" },
    { key: "R", description: "Switch to 🗺️ Milestone Roadmap tab" },
    { key: "A", description: "Switch to 📈 Analytics & Reports tab" },
    { key: "U", description: "Switch to 👥 Team Directory tab" },
    { key: "K", description: "Switch to 🏢 Clients & CRM tab" },
    { key: "D", description: "Switch to 📑 Presentations & Docs tab" },
    { key: "L", description: "Switch to 📜 Activity Feed tab" },
    { key: "?", description: "Toggle this Keyboard Shortcuts cheat sheet" },
    { key: "Esc", description: "Close any open modal or drawer" },
  ];

  return (
    <div className="ai-modal-overlay" onClick={onClose}>
      <div
        className="clay-card ai-modal-content"
        onClick={(e) => e.stopPropagation()}
        style={{
          maxWidth: "540px",
          width: "92%",
          maxHeight: "85vh",
          overflowY: "auto",
          padding: "24px",
          borderRadius: "20px",
          background: "var(--panel)",
          border: "1px solid var(--border)",
          boxShadow: "var(--shadow-soft)",
        }}
      >
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "18px" }}>
          <div>
            <h3 style={{ margin: 0, fontSize: "1.2rem", fontWeight: 700, color: "var(--text)" }}>
              ⌨️ Keyboard Shortcuts
            </h3>
            <span style={{ fontSize: "0.78rem", color: "var(--text-muted)" }}>Power-user productivity controls</span>
          </div>
          <button
            onClick={onClose}
            style={{ background: "none", border: "none", cursor: "pointer", fontSize: "1.3rem", color: "var(--text-muted)" }}
          >
            ×
          </button>
        </div>

        <div style={{ display: "flex", flexDirection: "column", gap: "8px" }}>
          {shortcuts.map((s, idx) => (
            <div
              key={idx}
              style={{
                display: "flex",
                justifyContent: "space-between",
                alignItems: "center",
                padding: "8px 12px",
                borderRadius: "10px",
                background: "var(--bg)",
                border: "1px solid var(--border)",
              }}
            >
              <span style={{ fontSize: "0.82rem", color: "var(--text)" }}>{s.description}</span>
              <kbd
                style={{
                  background: "var(--panel)",
                  border: "1px solid var(--border)",
                  borderRadius: "6px",
                  padding: "3px 8px",
                  fontSize: "0.78rem",
                  fontWeight: 700,
                  fontFamily: "monospace",
                  color: "#6366f1",
                  boxShadow: "0 2px 0 var(--border)",
                }}
              >
                {s.key}
              </kbd>
            </div>
          ))}
        </div>

        <div style={{ marginTop: "20px", textAlign: "right" }}>
          <button
            onClick={onClose}
            style={{
              padding: "8px 20px",
              borderRadius: "10px",
              background: "#6366f1",
              color: "#fff",
              border: "none",
              fontWeight: 700,
              fontSize: "0.85rem",
              cursor: "pointer",
            }}
          >
            Got it
          </button>
        </div>
      </div>
    </div>
  );
}

export default KeyboardShortcutsModal;

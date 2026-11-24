import { useState } from "react";
import ExecutiveReportModal from "./ExecutiveReportModal";
import "./AIComponents.css";

function ProjectAnalyticsModal({ project, tasks, onClose }) {
  const [copied, setCopied] = useState(false);
  const [showExecutiveReport, setShowExecutiveReport] = useState(false);
  const total = tasks.length;

  // Status breakdown
  const statusCounts = {
    "To Do": tasks.filter((t) => t.status === "To Do").length,
    "In Progress": tasks.filter((t) => t.status === "In Progress").length,
    "Review": tasks.filter((t) => t.status === "Review").length,
    "Done": tasks.filter((t) => t.status === "Done").length,
  };

  // Priority breakdown
  const priorityCounts = {
    High: tasks.filter((t) => t.priority_level?.toLowerCase() === "high").length,
    Medium: tasks.filter((t) => t.priority_level?.toLowerCase() === "medium").length,
    Low: tasks.filter((t) => t.priority_level?.toLowerCase() === "low").length,
  };

  // Assignee breakdown
  const memberCounts = {};
  tasks.forEach((t) => {
    const name = t.user_username || "Unassigned";
    memberCounts[name] = (memberCounts[name] || 0) + 1;
  });

  const completionRate = total > 0 ? Math.round((statusCounts["Done"] / total) * 100) : 0;

  // Export to CSV
  const handleExportCSV = () => {
    const headers = ["ID", "Title", "Status", "Priority", "Assignee", "Due Date"];
    const rows = tasks.map((t) => [
      t.id,
      `"${(t.title || "").replace(/"/g, '""')}"`,
      t.status,
      t.priority_level,
      `"${t.user_username || "Unassigned"}"`,
      t.due_date || "None",
    ]);

    const csvContent = "data:text/csv;charset=utf-8," + [headers.join(","), ...rows.map((r) => r.join(","))].join("\n");
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute("download", `${(project?.name || "FlowTrack").replace(/\s+/g, "_")}_tasks.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  // Export to Markdown
  const handleCopyMarkdown = () => {
    const md = [
      `# 📊 ${project?.name || "FlowTrack"} — Sprint Analytics Report`,
      `**Completion Rate:** ${completionRate}% (${statusCounts["Done"]}/${total} tasks completed)`,
      "",
      "## 📋 Status Breakdown",
      `- **To Do:** ${statusCounts["To Do"]}`,
      `- **In Progress:** ${statusCounts["In Progress"]}`,
      `- **Review:** ${statusCounts["Review"]}`,
      `- **Done:** ${statusCounts["Done"]}`,
      "",
      "## 🎯 Priority Breakdown",
      `- **High:** ${priorityCounts.High}`,
      `- **Medium:** ${priorityCounts.Medium}`,
      `- **Low:** ${priorityCounts.Low}`,
      "",
      "## 👥 Team Workload",
      ...Object.entries(memberCounts).map(([m, c]) => `- **${m}:** ${c} task(s)`),
      "",
      "## 📝 Detailed Task List",
      "| ID | Title | Status | Priority | Assignee | Due Date |",
      "|:---|:------|:-------|:---------|:---------|:---------|",
      ...tasks.map(
        (t) =>
          `| ${t.id} | ${t.title} | ${t.status} | ${t.priority_level} | ${t.user_username || "Unassigned"} | ${t.due_date || "N/A"} |`
      ),
    ].join("\n");

    navigator.clipboard.writeText(md);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="ai-modal-overlay" onClick={onClose}>
      <div className="ai-modal-card clay-card" onClick={(e) => e.stopPropagation()} style={{ maxWidth: "680px" }}>
        <div className="ai-modal-header">
          <div className="ai-badge-group">
            <span className="ai-tag">📊 Sprint Visual Intelligence</span>
            <h2>Project Analytics & Export Hub</h2>
            <p className="ai-subtitle">Performance metrics and workload distribution for <strong>{project?.name || "Active Board"}</strong></p>
          </div>
          <button className="ai-close-btn" onClick={onClose} aria-label="Close modal">×</button>
        </div>

        <div className="ai-modal-body" style={{ gap: "20px" }}>
          {/* Top Quick Stats */}
          <div className="ai-metrics-row">
            <div className="ai-metric-pill">
              <span className="metric-label">Completion Velocity</span>
              <span className="metric-value">{completionRate}%</span>
            </div>
            <div className="ai-metric-pill">
              <span className="metric-label">Total Work Items</span>
              <span className="metric-value">{total}</span>
            </div>
            <div className="ai-metric-pill">
              <span className="metric-label">Active Team Size</span>
              <span className="metric-value">{Object.keys(memberCounts).length}</span>
            </div>
          </div>

          {/* Status Breakdown Bar */}
          <div className="ai-section">
            <h4>Kanban Column Distribution</h4>
            <div style={{ display: "flex", height: "14px", borderRadius: "9999px", overflow: "hidden", background: "#e2e8f0", gap: "2px" }}>
              <div style={{ width: `${total ? (statusCounts["To Do"] / total) * 100 : 0}%`, background: "#3b82f6" }} title={`To Do: ${statusCounts["To Do"]}`} />
              <div style={{ width: `${total ? (statusCounts["In Progress"] / total) * 100 : 0}%`, background: "#f59e0b" }} title={`In Progress: ${statusCounts["In Progress"]}`} />
              <div style={{ width: `${total ? (statusCounts["Review"] / total) * 100 : 0}%`, background: "#8b5cf6" }} title={`Review: ${statusCounts["Review"]}`} />
              <div style={{ width: `${total ? (statusCounts["Done"] / total) * 100 : 0}%`, background: "#10b981" }} title={`Done: ${statusCounts["Done"]}`} />
            </div>
            <div style={{ display: "flex", justifyContent: "space-between", fontSize: "0.78rem", color: "var(--text-muted)", marginTop: "6px" }}>
              <span style={{ color: "#3b82f6", fontWeight: 700 }}>● To Do: {statusCounts["To Do"]}</span>
              <span style={{ color: "#f59e0b", fontWeight: 700 }}>● In Progress: {statusCounts["In Progress"]}</span>
              <span style={{ color: "#8b5cf6", fontWeight: 700 }}>● Review: {statusCounts["Review"]}</span>
              <span style={{ color: "#10b981", fontWeight: 700 }}>● Done: {statusCounts["Done"]}</span>
            </div>
          </div>

          {/* Priority Breakdown */}
          <div className="ai-section">
            <h4>Priority Distribution</h4>
            <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: "10px" }}>
              <div style={{ background: "var(--bg)", border: "1px solid var(--border)", padding: "10px", borderRadius: "12px", borderLeft: "4px solid #ef4444" }}>
                <span style={{ fontSize: "0.75rem", color: "var(--text-muted)", fontWeight: 700, textTransform: "uppercase" }}>High Priority</span>
                <p style={{ margin: "4px 0 0 0", fontSize: "1.2rem", fontWeight: 800, color: "#ef4444" }}>{priorityCounts.High}</p>
              </div>
              <div style={{ background: "var(--bg)", border: "1px solid var(--border)", padding: "10px", borderRadius: "12px", borderLeft: "4px solid #f59e0b" }}>
                <span style={{ fontSize: "0.75rem", color: "var(--text-muted)", fontWeight: 700, textTransform: "uppercase" }}>Medium Priority</span>
                <p style={{ margin: "4px 0 0 0", fontSize: "1.2rem", fontWeight: 800, color: "#f59e0b" }}>{priorityCounts.Medium}</p>
              </div>
              <div style={{ background: "var(--bg)", border: "1px solid var(--border)", padding: "10px", borderRadius: "12px", borderLeft: "4px solid #10b981" }}>
                <span style={{ fontSize: "0.75rem", color: "var(--text-muted)", fontWeight: 700, textTransform: "uppercase" }}>Low Priority</span>
                <p style={{ margin: "4px 0 0 0", fontSize: "1.2rem", fontWeight: 800, color: "#10b981" }}>{priorityCounts.Low}</p>
              </div>
            </div>
          </div>

          {/* Member Workload */}
          <div className="ai-section">
            <h4>Team Member Workload</h4>
            <div style={{ display: "flex", flexDirection: "column", gap: "8px" }}>
              {Object.entries(memberCounts).map(([member, count]) => {
                const percent = total > 0 ? Math.round((count / total) * 100) : 0;
                return (
                  <div key={member} style={{ display: "flex", alignItems: "center", gap: "12px", fontSize: "0.86rem" }}>
                    <span style={{ width: "130px", fontWeight: 600, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                      {member}
                    </span>
                    <div style={{ flex: 1, height: "8px", background: "var(--border)", borderRadius: "9999px", overflow: "hidden" }}>
                      <div style={{ width: `${percent}%`, height: "100%", background: "linear-gradient(90deg, #6366f1, #3b82f6)" }} />
                    </div>
                    <span style={{ width: "50px", textAlign: "right", color: "var(--text-muted)", fontWeight: 700 }}>
                      {count} ({percent}%)
                    </span>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Export Hub Buttons */}
          <div className="ai-section" style={{ borderTop: "1px solid var(--border)", paddingTop: "16px" }}>
            <h4>Export & Share Project Data</h4>
            <div style={{ display: "flex", flexWrap: "wrap", gap: "10px", marginTop: "8px" }}>
              <button
                className="btn primary"
                onClick={() => setShowExecutiveReport(true)}
                style={{ display: "inline-flex", alignItems: "center", gap: "6px", fontSize: "0.85rem", padding: "8px 18px", fontWeight: 700 }}
              >
                📄 Executive PDF Report
              </button>
              <button
                className="btn secondary"
                onClick={handleExportCSV}
                style={{ display: "inline-flex", alignItems: "center", gap: "6px", fontSize: "0.85rem", padding: "8px 16px" }}
              >
                📥 Download CSV Spreadsheet
              </button>
              <button
                className="btn secondary"
                onClick={handleCopyMarkdown}
                style={{ display: "inline-flex", alignItems: "center", gap: "6px", fontSize: "0.85rem", padding: "8px 16px" }}
              >
                {copied ? "✓ Copied to Clipboard!" : "📋 Copy Markdown"}
              </button>
            </div>
          </div>

          <div className="ai-footer">
            <span className="ai-powered-by">FlowTrack Intelligence System</span>
            <button className="btn secondary" onClick={onClose}>Done</button>
          </div>
        </div>
      </div>

      {showExecutiveReport && (
        <ExecutiveReportModal
          project={project}
          tasks={tasks}
          onClose={() => setShowExecutiveReport(false)}
        />
      )}
    </div>
  );
}

export default ProjectAnalyticsModal;

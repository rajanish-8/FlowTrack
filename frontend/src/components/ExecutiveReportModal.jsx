import { useState } from "react";
import logoAsset from "../assets/flowtrack-logo.svg";

function ExecutiveReportModal({ project, tasks = [], userRole, currentUser, onClose }) {
  const [copied, setCopied] = useState(false);
  const now = new Date();
  const reportDate = now.toLocaleDateString("en-US", {
    month: "long",
    day: "numeric",
    year: "numeric",
  });
  const reportTime = now.toLocaleTimeString("en-US", { hour: "2-digit", minute: "2-digit" });

  const total = tasks.length || 0;
  const doneTasks = tasks.filter((t) => t.status === "Done");
  const inProgressTasks = tasks.filter((t) => t.status === "In Progress");
  const reviewTasks = tasks.filter((t) => t.status === "Review");
  const todoTasks = tasks.filter((t) => t.status === "To Do");
  const highPriorityTasks = tasks.filter((t) => (t.priority_level || "").toLowerCase() === "high");

  const overdueTasks = tasks.filter((t) => {
    if (!t.due_date || t.status === "Done") return false;
    const due = new Date(t.due_date);
    due.setHours(0, 0, 0, 0);
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    return due < today;
  });

  const completionRate = total > 0 ? Math.round((doneTasks.length / total) * 100) : 0;

  // Determine Project Health Grade
  let healthGrade = { label: "EXCELLENT", color: "#10b981", bg: "rgba(16, 185, 129, 0.12)", border: "#10b981" };
  if (overdueTasks.length > 2 || (total > 0 && completionRate < 20)) {
    healthGrade = { label: "ATTENTION NEEDED", color: "#ef4444", bg: "rgba(239, 68, 68, 0.12)", border: "#ef4444" };
  } else if (overdueTasks.length > 0 || inProgressTasks.length > 5) {
    healthGrade = { label: "MODERATE VELOCITY", color: "#f59e0b", bg: "rgba(245, 158, 11, 0.12)", border: "#f59e0b" };
  }

  // Workload by member
  const memberWorkload = {};
  tasks.forEach((t) => {
    const name = t.user_username || "Unassigned";
    if (!memberWorkload[name]) {
      memberWorkload[name] = { total: 0, done: 0 };
    }
    memberWorkload[name].total += 1;
    if (t.status === "Done") memberWorkload[name].done += 1;
  });

  const handlePrint = () => {
    window.print();
  };

  const handleCopySummary = () => {
    const text = `FlowTrack Executive Report — ${project?.name || "Active Project"}
Date: ${reportDate} ${reportTime}
Status: ${healthGrade.label} (${completionRate}% Complete)
Key KPIs:
- Total Work Items: ${total}
- Completed: ${doneTasks.length} (${completionRate}%)
- In Progress: ${inProgressTasks.length}
- In Review: ${reviewTasks.length}
- Overdue Items: ${overdueTasks.length}
- High Priority Risks: ${highPriorityTasks.length}

Team Allocation:
${Object.entries(memberWorkload).map(([m, data]) => `• ${m}: ${data.done}/${data.total} completed`).join("\n")}`;

    navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="ai-modal-overlay" onClick={onClose}>
      <div
        className="clay-card ai-modal-content executive-report-modal"
        onClick={(e) => e.stopPropagation()}
        style={{
          maxWidth: "880px",
          width: "92%",
          maxHeight: "92vh",
          padding: 0,
          borderRadius: "20px",
          background: "var(--panel)",
          border: "1px solid var(--border)",
          boxShadow: "0 25px 60px rgba(0,0,0,0.35)",
          overflow: "hidden",
          display: "flex",
          flexDirection: "column",
        }}
      >
        {/* Action Toolbar (Hidden during Print) */}
        <div
          className="no-print"
          style={{
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
            padding: "16px 24px",
            background: "var(--bg)",
            borderBottom: "1px solid var(--border)",
          }}
        >
          <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
            <span style={{ fontSize: "1.2rem" }}>📊</span>
            <strong style={{ fontSize: "1rem", color: "var(--text)" }}>Executive Sprint Report</strong>
            <span
              style={{
                fontSize: "0.72rem",
                padding: "2px 8px",
                borderRadius: "9999px",
                background: "rgba(99, 102, 241, 0.15)",
                color: "#6366f1",
                fontWeight: 700,
              }}
            >
              PDF READY
            </span>
          </div>

          <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
            <button
              onClick={handleCopySummary}
              className="btn btn-secondary"
              style={{ fontSize: "0.82rem", padding: "6px 14px" }}
            >
              {copied ? "✓ Copied!" : "📋 Copy Summary"}
            </button>
            <button
              onClick={handlePrint}
              className="btn btn-primary"
              style={{
                fontSize: "0.82rem",
                padding: "6px 16px",
                display: "inline-flex",
                alignItems: "center",
                gap: "6px",
              }}
            >
              🖨️ Print / Save as PDF
            </button>
            <button
              onClick={onClose}
              style={{
                background: "none",
                border: "none",
                fontSize: "1.4rem",
                cursor: "pointer",
                color: "var(--text-muted)",
                marginLeft: "8px",
              }}
              aria-label="Close"
            >
              ×
            </button>
          </div>
        </div>

        {/* Printable Executive Document Area */}
        <div
          id="executive-report-document"
          style={{
            padding: "32px 36px",
            overflowY: "auto",
            flex: 1,
            color: "var(--text)",
            fontFamily: "Inter, sans-serif",
          }}
        >
          {/* Executive Letterhead Header */}
          <div
            style={{
              display: "flex",
              justifyContent: "space-between",
              alignItems: "flex-start",
              paddingBottom: "20px",
              borderBottom: "2px solid var(--border)",
              marginBottom: "24px",
            }}
          >
            <div>
              <div style={{ display: "flex", alignItems: "center", gap: "10px", marginBottom: "6px" }}>
                <img
                  src={logoAsset}
                  alt="FlowTrack Logo"
                  style={{ width: "26px", height: "26px", filter: "invert(35%) sepia(90%) saturate(1200%) hue-rotate(200deg)" }}
                />
                <h1 style={{ margin: 0, fontSize: "1.5rem", fontWeight: 800, letterSpacing: "-0.02em" }}>
                  FlowTrack
                </h1>
                <span
                  style={{
                    fontSize: "0.7rem",
                    fontWeight: 800,
                    padding: "2px 6px",
                    borderRadius: "4px",
                    background: "rgba(99, 102, 241, 0.12)",
                    color: "#6366f1",
                  }}
                >
                  ENTERPRISE REPORT
                </span>
              </div>
              <h2 style={{ margin: "6px 0 2px 0", fontSize: "1.8rem", fontWeight: 900 }}>
                {project?.name || "Active Workspace"}
              </h2>
              <p style={{ margin: 0, fontSize: "0.85rem", color: "var(--text-muted)" }}>
                Executive Work Velocity, Resource Allocation & Risk Briefing
              </p>
            </div>

            <div style={{ textAlign: "right" }}>
              <div
                style={{
                  display: "inline-block",
                  padding: "4px 12px",
                  borderRadius: "9999px",
                  background: healthGrade.bg,
                  color: healthGrade.color,
                  border: `1px solid ${healthGrade.border}`,
                  fontWeight: 800,
                  fontSize: "0.78rem",
                  letterSpacing: "0.04em",
                  marginBottom: "8px",
                }}
              >
                ● STATUS: {healthGrade.label}
              </div>
              <div style={{ fontSize: "0.8rem", color: "var(--text-muted)" }}>Generated: {reportDate}</div>
              <div style={{ fontSize: "0.75rem", color: "var(--text-muted)" }}>Audited by: {currentUser?.username || "Admin"}</div>
            </div>
          </div>

          {/* Executive KPI Scorecard */}
          <div style={{ marginBottom: "28px" }}>
            <h3 style={{ fontSize: "0.95rem", textTransform: "uppercase", letterSpacing: "0.06em", color: "var(--text-muted)", marginBottom: "12px" }}>
              Key Execution Metrics
            </h3>
            <div style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: "12px" }}>
              <div
                style={{
                  padding: "16px",
                  borderRadius: "14px",
                  background: "var(--bg)",
                  border: "1px solid var(--border)",
                  borderTop: "3px solid #2563eb",
                }}
              >
                <div style={{ fontSize: "0.75rem", color: "var(--text-muted)", fontWeight: 700, textTransform: "uppercase" }}>Completion Velocity</div>
                <div style={{ fontSize: "1.8rem", fontWeight: 900, color: "var(--text)", margin: "4px 0" }}>{completionRate}%</div>
                <div style={{ fontSize: "0.74rem", color: "var(--text-muted)" }}>{doneTasks.length} of {total} items delivered</div>
              </div>

              <div
                style={{
                  padding: "16px",
                  borderRadius: "14px",
                  background: "var(--bg)",
                  border: "1px solid var(--border)",
                  borderTop: "3px solid #f59e0b",
                }}
              >
                <div style={{ fontSize: "0.75rem", color: "var(--text-muted)", fontWeight: 700, textTransform: "uppercase" }}>In Flight Work</div>
                <div style={{ fontSize: "1.8rem", fontWeight: 900, color: "#d97706", margin: "4px 0" }}>{inProgressTasks.length + reviewTasks.length}</div>
                <div style={{ fontSize: "0.74rem", color: "var(--text-muted)" }}>{inProgressTasks.length} active, {reviewTasks.length} in review</div>
              </div>

              <div
                style={{
                  padding: "16px",
                  borderRadius: "14px",
                  background: "var(--bg)",
                  border: "1px solid var(--border)",
                  borderTop: "3px solid #ef4444",
                }}
              >
                <div style={{ fontSize: "0.75rem", color: "var(--text-muted)", fontWeight: 700, textTransform: "uppercase" }}>Overdue Tasks</div>
                <div style={{ fontSize: "1.8rem", fontWeight: 900, color: overdueTasks.length > 0 ? "#ef4444" : "#10b981", margin: "4px 0" }}>
                  {overdueTasks.length}
                </div>
                <div style={{ fontSize: "0.74rem", color: "var(--text-muted)" }}>
                  {overdueTasks.length === 0 ? "All deadlines on schedule" : "Requires immediate review"}
                </div>
              </div>

              <div
                style={{
                  padding: "16px",
                  borderRadius: "14px",
                  background: "var(--bg)",
                  border: "1px solid var(--border)",
                  borderTop: "3px solid #7c3aed",
                }}
              >
                <div style={{ fontSize: "0.75rem", color: "var(--text-muted)", fontWeight: 700, textTransform: "uppercase" }}>High Priority Ratio</div>
                <div style={{ fontSize: "1.8rem", fontWeight: 900, color: "#7c3aed", margin: "4px 0" }}>
                  {total > 0 ? Math.round((highPriorityTasks.length / total) * 100) : 0}%
                </div>
                <div style={{ fontSize: "0.74rem", color: "var(--text-muted)" }}>{highPriorityTasks.length} critical work item(s)</div>
              </div>
            </div>
          </div>

          {/* Progress Bar */}
          <div style={{ marginBottom: "28px" }}>
            <div style={{ display: "flex", justifyContent: "space-between", marginBottom: "6px", fontSize: "0.85rem", fontWeight: 700 }}>
              <span>Sprint Delivery Progress</span>
              <span style={{ color: "var(--brand)" }}>{completionRate}% Completed</span>
            </div>
            <div style={{ height: "10px", background: "var(--border)", borderRadius: "9999px", overflow: "hidden" }}>
              <div
                style={{
                  width: `${completionRate}%`,
                  height: "100%",
                  background: "linear-gradient(90deg, #2563eb, #10b981)",
                  borderRadius: "9999px",
                }}
              />
            </div>
          </div>

          {/* Two-Column Section: Workload & Risk Factors */}
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "20px", marginBottom: "28px" }}>
            {/* Team Resource Allocation */}
            <div
              style={{
                padding: "20px",
                borderRadius: "14px",
                background: "var(--bg)",
                border: "1px solid var(--border)",
              }}
            >
              <h4 style={{ margin: "0 0 14px 0", fontSize: "0.95rem" }}>👥 Collaborator Allocation</h4>
              <div style={{ display: "flex", flexDirection: "column", gap: "10px" }}>
                {Object.entries(memberWorkload).map(([member, data]) => {
                  const pct = data.total > 0 ? Math.round((data.done / data.total) * 100) : 0;
                  return (
                    <div key={member}>
                      <div style={{ display: "flex", justifyContent: "space-between", fontSize: "0.82rem", marginBottom: "4px" }}>
                        <strong style={{ color: "var(--text)" }}>{member}</strong>
                        <span style={{ color: "var(--text-muted)" }}>
                          {data.done}/{data.total} tasks ({pct}%)
                        </span>
                      </div>
                      <div style={{ height: "6px", background: "var(--border)", borderRadius: "9999px", overflow: "hidden" }}>
                        <div style={{ width: `${pct}%`, height: "100%", background: "#10b981" }} />
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Risk & Bottleneck Summary */}
            <div
              style={{
                padding: "20px",
                borderRadius: "14px",
                background: "var(--bg)",
                border: "1px solid var(--border)",
              }}
            >
              <h4 style={{ margin: "0 0 14px 0", fontSize: "0.95rem" }}>⚡ Strategic Observations</h4>
              <ul style={{ margin: 0, paddingLeft: "18px", fontSize: "0.84rem", lineHeight: 1.6, color: "var(--text)" }}>
                <li>
                  <strong>Pipeline Balance:</strong> {todoTasks.length} tasks in backlog, {inProgressTasks.length} in development, {reviewTasks.length} in QA review.
                </li>
                <li>
                  <strong>Deadline Health:</strong> {overdueTasks.length > 0 ? `${overdueTasks.length} overdue task(s) flagged for escalation.` : "No overdue tasks currently logged."}
                </li>
                <li>
                  <strong>Resource Spread:</strong> Active contributions across {Object.keys(memberWorkload).length} collaborator(s).
                </li>
                <li>
                  <strong>Executive Recommendation:</strong>{" "}
                  {completionRate > 75
                    ? "Sprint on track for early delivery. Prepare post-launch validation."
                    : inProgressTasks.length > reviewTasks.length * 2
                    ? "WIP limit exceeded. Focus on advancing in-progress cards to review."
                    : "Maintain consistent review cadence to accelerate velocity."}
                </li>
              </ul>
            </div>
          </div>

          {/* Full Task Register Table */}
          <div>
            <h4 style={{ margin: "0 0 12px 0", fontSize: "0.95rem" }}>📋 Comprehensive Task Register</h4>
            <div style={{ overflowX: "auto", border: "1px solid var(--border)", borderRadius: "12px" }}>
              <table style={{ width: "100%", borderCollapse: "collapse", fontSize: "0.82rem" }}>
                <thead>
                  <tr style={{ background: "var(--bg)", borderBottom: "1px solid var(--border)", textAlign: "left" }}>
                    <th style={{ padding: "10px 14px", fontWeight: 700 }}>Task Title</th>
                    <th style={{ padding: "10px 14px", fontWeight: 700 }}>Stage</th>
                    <th style={{ padding: "10px 14px", fontWeight: 700 }}>Priority</th>
                    <th style={{ padding: "10px 14px", fontWeight: 700 }}>Assignee</th>
                    <th style={{ padding: "10px 14px", fontWeight: 700 }}>Target Due Date</th>
                  </tr>
                </thead>
                <tbody>
                  {tasks.map((t, idx) => (
                    <tr
                      key={t.id}
                      style={{
                        borderBottom: idx !== tasks.length - 1 ? "1px solid var(--border)" : "none",
                        background: idx % 2 === 0 ? "transparent" : "rgba(0,0,0,0.015)",
                      }}
                    >
                      <td style={{ padding: "10px 14px", fontWeight: 600 }}>{t.title}</td>
                      <td style={{ padding: "10px 14px" }}>
                        <span
                          style={{
                            padding: "2px 8px",
                            borderRadius: "6px",
                            fontSize: "0.75rem",
                            fontWeight: 700,
                            background:
                              t.status === "Done"
                                ? "rgba(16, 185, 129, 0.15)"
                                : t.status === "In Progress"
                                ? "rgba(245, 158, 11, 0.15)"
                                : "rgba(59, 130, 246, 0.15)",
                            color:
                              t.status === "Done"
                                ? "#059669"
                                : t.status === "In Progress"
                                ? "#d97706"
                                : "#2563eb",
                          }}
                        >
                          {t.status}
                        </span>
                      </td>
                      <td style={{ padding: "10px 14px", textTransform: "capitalize" }}>{t.priority_level}</td>
                      <td style={{ padding: "10px 14px", color: "var(--text-muted)" }}>{t.user_username || "Unassigned"}</td>
                      <td style={{ padding: "10px 14px", color: "var(--text-muted)" }}>{t.due_date || "—"}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          {/* Letterhead Footer */}
          <div
            style={{
              marginTop: "32px",
              paddingTop: "16px",
              borderTop: "1px solid var(--border)",
              display: "flex",
              justifyContent: "space-between",
              fontSize: "0.75rem",
              color: "var(--text-muted)",
            }}
          >
            <span>Generated securely by FlowTrack Pro Platform</span>
            <span>Document ID: FT-EXP-{project?.id || 1}-{Date.now().toString().slice(-6)}</span>
          </div>
        </div>
      </div>
    </div>
  );
}

export default ExecutiveReportModal;

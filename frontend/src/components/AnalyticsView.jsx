import { useState, useEffect, useCallback } from "react";
import ExecutiveReportModal from "./ExecutiveReportModal";
import { API_BASE_URL } from "../utils/api";

// ─── Helpers ────────────────────────────────────────────────────────────────

function getToken() {
  return localStorage.getItem("token");
}

function authFetch(url) {
  return fetch(url, {
    headers: { Authorization: `Token ${getToken()}`, "Content-Type": "application/json" },
  }).then((r) => (r.ok ? r.json() : Promise.reject(r.status)));
}

/** Given a list of tasks return { weekLabel: { planned, done } } for last 4 weeks */
function groupByWeek(tasks) {
  const now = new Date();
  const weeks = [];
  for (let w = 3; w >= 0; w--) {
    const start = new Date(now);
    start.setDate(now.getDate() - now.getDay() - w * 7);
    start.setHours(0, 0, 0, 0);
    const end = new Date(start);
    end.setDate(start.getDate() + 6);
    end.setHours(23, 59, 59, 999);
    const label = `Wk ${start.getMonth() + 1}/${start.getDate()}`;
    weeks.push({ label, start, end, planned: 0, done: 0 });
  }

  tasks.forEach((t) => {
    if (!t.due_date) return;
    const d = new Date(t.due_date);
    weeks.forEach((w) => {
      if (d >= w.start && d <= w.end) {
        w.planned += 1;
        if (t.status === "Done") w.done += 1;
      }
    });
  });
  return weeks;
}

/** Group tasks by due_date => [{date, count}] sorted */
function groupByDate(tasks) {
  const map = {};
  tasks.forEach((t) => {
    if (!t.due_date) return;
    map[t.due_date] = (map[t.due_date] || 0) + 1;
  });
  return Object.entries(map)
    .sort(([a], [b]) => a.localeCompare(b))
    .map(([date, count]) => ({ date, count }));
}

// ─── SVG Bar Chart ────────────────────────────────────────────────────────────

function BarChart({ data }) {
  // data: [{label, value, color}]
  const W = 480, H = 160, PAD = 36, BAR_GAP = 10;
  const maxVal = Math.max(...data.map((d) => d.value), 1);
  const barW = (W - PAD * 2 - BAR_GAP * (data.length - 1)) / data.length;

  return (
    <svg viewBox={`0 0 ${W} ${H + 24}`} style={{ width: "100%", maxWidth: W, display: "block" }}>
      {/* Y grid lines */}
      {[0, 0.25, 0.5, 0.75, 1].map((frac) => {
        const y = PAD + (H - PAD) * (1 - frac);
        return (
          <g key={frac}>
            <line x1={PAD} x2={W} y1={y} y2={y} stroke="var(--border)" strokeWidth="1" />
            <text x={PAD - 4} y={y + 4} textAnchor="end" fontSize="10" fill="var(--text-muted)">
              {Math.round(frac * maxVal)}
            </text>
          </g>
        );
      })}
      {data.map((d, i) => {
        const bh = Math.max(2, ((d.value / maxVal) * (H - PAD)));
        const x = PAD + i * (barW + BAR_GAP);
        const y = H - bh;
        return (
          <g key={d.label}>
            <rect x={x} y={y} width={barW} height={bh} fill={d.color} rx="4" opacity="0.9" />
            <text x={x + barW / 2} y={H + 14} textAnchor="middle" fontSize="10" fill="var(--text-muted)">
              {d.label}
            </text>
            {d.value > 0 && (
              <text x={x + barW / 2} y={y - 4} textAnchor="middle" fontSize="10" fontWeight="700" fill={d.color}>
                {d.value}
              </text>
            )}
          </g>
        );
      })}
    </svg>
  );
}

// ─── SVG Line Chart ───────────────────────────────────────────────────────────

function LineChart({ data }) {
  // data: [{date, count}]
  const W = 480, H = 140, PAD = 40;
  if (!data.length) return <p style={{ color: "var(--text-muted)", fontSize: "0.82rem" }}>No dated tasks to display.</p>;

  const maxVal = Math.max(...data.map((d) => d.count), 1);
  const pts = data.map((d, i) => {
    const x = PAD + (i / Math.max(data.length - 1, 1)) * (W - PAD * 2);
    const y = PAD + (1 - d.count / maxVal) * (H - PAD);
    return { x, y, ...d };
  });
  const polyline = pts.map((p) => `${p.x},${p.y}`).join(" ");
  // area fill
  const areaPoints = [
    `${pts[0].x},${H}`,
    ...pts.map((p) => `${p.x},${p.y}`),
    `${pts[pts.length - 1].x},${H}`,
  ].join(" ");

  return (
    <svg viewBox={`0 0 ${W} ${H + 20}`} style={{ width: "100%", maxWidth: W, display: "block" }}>
      {/* Y grid */}
      {[0, 0.5, 1].map((frac) => {
        const y = PAD + (H - PAD) * (1 - frac);
        return (
          <g key={frac}>
            <line x1={PAD} x2={W - 10} y1={y} y2={y} stroke="var(--border)" strokeWidth="1" />
            <text x={PAD - 4} y={y + 4} textAnchor="end" fontSize="10" fill="var(--text-muted)">
              {Math.round(frac * maxVal)}
            </text>
          </g>
        );
      })}
      {/* Area */}
      <polygon points={areaPoints} fill="rgba(99,102,241,0.08)" />
      {/* Line */}
      <polyline points={polyline} fill="none" stroke="#6366f1" strokeWidth="2.5" strokeLinejoin="round" />
      {/* Dots + labels */}
      {pts.map((p, i) => (
        <g key={i}>
          <circle cx={p.x} cy={p.y} r="4" fill="#6366f1" />
          <text x={p.x} y={H + 14} textAnchor="middle" fontSize="9" fill="var(--text-muted)">
            {p.date.slice(5)}
          </text>
        </g>
      ))}
    </svg>
  );
}

// ─── SVG Grouped Bar Chart (Sprint Velocity) ─────────────────────────────────

function GroupedBarChart({ weeks }) {
  const W = 480, H = 150, PAD = 36, GRP_GAP = 20, BAR_GAP = 3;
  const maxVal = Math.max(...weeks.flatMap((w) => [w.planned, w.done]), 1);
  const grpW = (W - PAD * 2 - GRP_GAP * (weeks.length - 1)) / weeks.length;
  const bW = (grpW - BAR_GAP) / 2;

  return (
    <svg viewBox={`0 0 ${W} ${H + 24}`} style={{ width: "100%", maxWidth: W, display: "block" }}>
      {[0, 0.5, 1].map((frac) => {
        const y = PAD + (H - PAD) * (1 - frac);
        return (
          <g key={frac}>
            <line x1={PAD} x2={W} y1={y} y2={y} stroke="var(--border)" strokeWidth="1" />
            <text x={PAD - 4} y={y + 4} textAnchor="end" fontSize="10" fill="var(--text-muted)">
              {Math.round(frac * maxVal)}
            </text>
          </g>
        );
      })}
      {weeks.map((w, i) => {
        const gx = PAD + i * (grpW + GRP_GAP);
        const ph = Math.max(2, (w.planned / maxVal) * (H - PAD));
        const dh = Math.max(2, (w.done / maxVal) * (H - PAD));
        return (
          <g key={w.label}>
            {/* Planned bar */}
            <rect x={gx} y={H - ph} width={bW} height={ph} fill="#6366f1" rx="3" opacity="0.85" />
            {/* Done bar */}
            <rect x={gx + bW + BAR_GAP} y={H - dh} width={bW} height={dh} fill="#10b981" rx="3" opacity="0.85" />
            <text x={gx + grpW / 2} y={H + 14} textAnchor="middle" fontSize="9" fill="var(--text-muted)">
              {w.label}
            </text>
          </g>
        );
      })}
    </svg>
  );
}

// ─── Main Component ───────────────────────────────────────────────────────────

function AnalyticsView({ project, tasks: propTasks = [], onTaskUpdated }) {
  const [copied, setCopied] = useState(false);
  const [showExecutiveModal, setShowExecutiveModal] = useState(false);
  const [tasks, setTasks] = useState(propTasks);
  const [members, setMembers] = useState([]);
  const [loading, setLoading] = useState(false);

  // Fetch real task + member data when project changes
  const fetchData = useCallback(async () => {
    if (!project?.id) return;
    setLoading(true);
    try {
      const [taskData, memberData] = await Promise.all([
        authFetch(`${API_BASE_URL}/tasks/?project=${project.id}`),
        authFetch(`${API_BASE_URL}/projects/${project.id}/members/`).catch(() => []),
      ]);
      // Handle paginated or plain array response
      const taskList = Array.isArray(taskData) ? taskData : (taskData.results || []);
      setTasks(taskList);
      const memberList = Array.isArray(memberData) ? memberData : (memberData.results || []);
      setMembers(memberList);
    } catch {
      // Fall back to prop tasks
      setTasks(propTasks);
    } finally {
      setLoading(false);
    }
  }, [project?.id]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  // Keep in sync with prop updates (e.g. task created from board)
  useEffect(() => {
    if (!project?.id) setTasks(propTasks);
  }, [propTasks, project?.id]);

  // ── Derived Stats ──────────────────────────────────────────────────────────

  const total = tasks.length;

  const statusCounts = {
    "To Do": tasks.filter((t) => t.status === "To Do").length,
    "In Progress": tasks.filter((t) => t.status === "In Progress").length,
    Review: tasks.filter((t) => t.status === "Review").length,
    Done: tasks.filter((t) => t.status === "Done").length,
  };

  const priorityCounts = {
    High: tasks.filter((t) => t.priority_level?.toLowerCase() === "high").length,
    Medium: tasks.filter((t) => t.priority_level?.toLowerCase() === "medium").length,
    Low: tasks.filter((t) => t.priority_level?.toLowerCase() === "low").length,
  };

  const memberCounts = {};
  tasks.forEach((t) => {
    const name = t.user_username || "Unassigned";
    memberCounts[name] = (memberCounts[name] || 0) + 1;
  });

  const completionRate = total > 0 ? Math.round((statusCounts["Done"] / total) * 100) : 0;
  const inFlightCount = statusCounts["In Progress"] + statusCounts["Review"];
  const overdueTasks = tasks.filter((t) => {
    if (!t.due_date || t.status === "Done") return false;
    return new Date(t.due_date) < new Date(new Date().toDateString());
  });

  // ── Chart data ─────────────────────────────────────────────────────────────

  const statusBarData = [
    { label: "To Do", value: statusCounts["To Do"], color: "#3b82f6" },
    { label: "In Progress", value: statusCounts["In Progress"], color: "#f59e0b" },
    { label: "Review", value: statusCounts["Review"], color: "#8b5cf6" },
    { label: "Done", value: statusCounts["Done"], color: "#10b981" },
  ];

  const lineData = groupByDate(tasks);
  const sprintWeeks = groupByWeek(tasks);

  // ── Team Time Report ───────────────────────────────────────────────────────
  // Build member rows: use project members API + fallback to task-derived list
  const teamRows = (() => {
    const taskCountByUser = {};
    tasks.forEach((t) => {
      const key = t.user_username || t.assigned_to_username || "Unassigned";
      taskCountByUser[key] = (taskCountByUser[key] || 0) + 1;
    });

    // Merge with fetched members
    const names = new Set([...Object.keys(taskCountByUser)]);
    members.forEach((m) => {
      const name = m.user?.username || m.username || m.name || String(m.user || m.id);
      names.add(name);
    });

    return Array.from(names).map((name) => {
      const taskCount = taskCountByUser[name] || 0;
      const estHours = taskCount * 2;
      return { name, taskCount, estHours };
    });
  })();

  const maxHours = Math.max(...teamRows.map((r) => r.estHours), 1);

  // ── Exports ─────────────────────────────────────────────────────────────────

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
    const csvContent =
      "data:text/csv;charset=utf-8," +
      [headers.join(","), ...rows.map((r) => r.join(","))].join("\n");
    const link = document.createElement("a");
    link.setAttribute("href", encodeURI(csvContent));
    link.setAttribute("download", `${(project?.name || "FlowTrack").replace(/\s+/g, "_")}_analytics.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const handleCopyMarkdown = () => {
    const md = [
      `# 📊 ${project?.name || "FlowTrack"} — Executive Sprint Intelligence Report`,
      `**Generated:** ${new Date().toLocaleDateString()}`,
      `**Completion Velocity:** ${completionRate}% (${statusCounts["Done"]}/${total} items delivered)`,
      "",
      "## 📋 Kanban Stage Distribution",
      `- **To Do:** ${statusCounts["To Do"]}`,
      `- **In Progress:** ${statusCounts["In Progress"]}`,
      `- **Review:** ${statusCounts["Review"]}`,
      `- **Done:** ${statusCounts["Done"]}`,
      "",
      "## 🎯 Priority Matrix",
      `- **High:** ${priorityCounts.High}`,
      `- **Medium:** ${priorityCounts.Medium}`,
      `- **Low:** ${priorityCounts.Low}`,
      "",
      "## 👥 Collaborator Allocation",
      ...Object.entries(memberCounts).map(([m, c]) => `- **${m}:** ${c} tasks`),
    ].join("\n");
    navigator.clipboard.writeText(md);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handlePrintExport = () => {
    window.print();
  };

  // ─────────────────────────────────────────────────────────────────────────

  return (
    <>
      {/* ── @media print hidden-until-print report div ─────────────────── */}
      <div id="print-report-view" style={{ display: "none" }}>
        <div className="print-report-inner">
          {/* Header */}
          <div className="print-header">
            <div>
              <h1 className="print-logo">⬡ FlowTrack</h1>
              <h2 className="print-project-name">{project?.name || "Project Report"}</h2>
              <p className="print-subtitle">Executive Analytics Report</p>
            </div>
            <div className="print-date">
              <div>Generated: {new Date().toLocaleDateString("en-US", { year: "numeric", month: "long", day: "numeric" })}</div>
              <div style={{ fontSize: "0.75rem", marginTop: "4px", opacity: 0.7 }}>FlowTrack Platform</div>
            </div>
          </div>

          {/* Summary Table */}
          <h3 className="print-section-title">Summary Overview</h3>
          <table className="print-table">
            <tbody>
              <tr><td>Total Tasks</td><td><strong>{total}</strong></td></tr>
              <tr><td>Completed (Done)</td><td><strong>{statusCounts["Done"]}</strong></td></tr>
              <tr><td>In Progress</td><td><strong>{statusCounts["In Progress"]}</strong></td></tr>
              <tr><td>In Review</td><td><strong>{statusCounts["Review"]}</strong></td></tr>
              <tr><td>Overdue Tasks</td><td><strong style={{ color: overdueTasks.length > 0 ? "#ef4444" : "inherit" }}>{overdueTasks.length}</strong></td></tr>
              <tr><td>Completion Rate</td><td><strong>{completionRate}%</strong></td></tr>
            </tbody>
          </table>

          {/* Task List */}
          <h3 className="print-section-title" style={{ marginTop: "24px" }}>Task Register</h3>
          <table className="print-table print-task-table">
            <thead>
              <tr>
                <th>Title</th>
                <th>Assignee</th>
                <th>Status</th>
                <th>Priority</th>
                <th>Due Date</th>
              </tr>
            </thead>
            <tbody>
              {tasks.map((t) => (
                <tr key={t.id}>
                  <td>{t.title}</td>
                  <td>{t.user_username || "Unassigned"}</td>
                  <td>{t.status}</td>
                  <td style={{ textTransform: "capitalize" }}>{t.priority_level || "Medium"}</td>
                  <td>{t.due_date || "—"}</td>
                </tr>
              ))}
            </tbody>
          </table>

          <div className="print-footer">
            <span>Confidential · FlowTrack Platform</span>
            <span>Report ID: FT-{project?.id || 0}-{Date.now().toString().slice(-6)}</span>
          </div>
        </div>
      </div>

      {/* ── Print CSS injected as style tag ─────────────────────────── */}
      <style>{`
        @media print {
          body > * { display: none !important; }
          #print-report-view { display: block !important; }
          #print-report-view .print-report-inner {
            font-family: 'Inter', Arial, sans-serif;
            color: #111;
            padding: 32px 40px;
            max-width: 900px;
            margin: 0 auto;
          }
          .print-header {
            display: flex;
            justify-content: space-between;
            align-items: flex-start;
            border-bottom: 2px solid #e5e7eb;
            padding-bottom: 16px;
            margin-bottom: 20px;
          }
          .print-logo { font-size: 1.3rem; font-weight: 900; margin: 0 0 4px; color: #4f46e5; }
          .print-project-name { font-size: 1.8rem; font-weight: 800; margin: 0 0 2px; }
          .print-subtitle { font-size: 0.9rem; color: #6b7280; margin: 0; }
          .print-date { text-align: right; font-size: 0.85rem; color: #374151; }
          .print-section-title { font-size: 1rem; font-weight: 700; text-transform: uppercase;
            letter-spacing: 0.05em; color: #374151; margin: 16px 0 8px; }
          .print-table { width: 100%; border-collapse: collapse; font-size: 0.85rem; }
          .print-table th, .print-table td { border: 1px solid #e5e7eb; padding: 8px 12px; text-align: left; }
          .print-table thead tr { background: #f9fafb; font-weight: 700; }
          .print-table tbody tr:nth-child(even) { background: #f9fafb; }
          .print-task-table th { background: #f3f4f6; }
          .print-footer { margin-top: 32px; padding-top: 12px; border-top: 1px solid #e5e7eb;
            display: flex; justify-content: space-between; font-size: 0.75rem; color: #9ca3af; }
        }
      `}</style>

      {/* ── Main Analytics UI ─────────────────────────────────────────────── */}
      <div style={{ maxWidth: "1280px", margin: "0 auto", padding: "10px 16px 40px" }}>

        {/* Header Bar */}
        <div
          className="clay-card"
          style={{
            padding: "20px 24px", borderRadius: "18px", background: "var(--panel)",
            border: "1px solid var(--border)", boxShadow: "var(--shadow-soft)",
            marginBottom: "20px", display: "flex", flexWrap: "wrap",
            justifyContent: "space-between", alignItems: "center", gap: "16px",
          }}
        >
          <div>
            <span style={{
              fontSize: "0.72rem", fontWeight: 800, textTransform: "uppercase",
              padding: "3px 8px", borderRadius: "6px",
              background: "rgba(99, 102, 241, 0.12)", color: "var(--brand)",
              border: "1px solid rgba(99, 102, 241, 0.25)",
            }}>
              📊 SPRINT VISUAL INTELLIGENCE
            </span>
            <h2 style={{ margin: "6px 0 2px", fontSize: "1.4rem", fontWeight: 800, color: "var(--text)" }}>
              Project Analytics & Export Hub
            </h2>
            <p style={{ margin: 0, fontSize: "0.82rem", color: "var(--text-muted)" }}>
              Real-time telemetry, workload distribution and audit summaries for{" "}
              <strong>{project?.name || "FlowTrack Web Platform"}</strong>
              {loading && <span style={{ marginLeft: 8, opacity: 0.6 }}>⟳ Refreshing…</span>}
            </p>
          </div>

          {/* Action Buttons */}
          <div style={{ display: "flex", gap: "10px", flexWrap: "wrap" }}>
            <button
              onClick={handlePrintExport}
              style={{
                padding: "9px 16px", borderRadius: "12px",
                background: "linear-gradient(135deg, #2563eb 0%, #1d4ed8 100%)",
                color: "#fff", border: "none", fontSize: "0.82rem",
                fontWeight: 700, cursor: "pointer",
                boxShadow: "0 4px 12px rgba(37, 99, 235, 0.3)",
                display: "inline-flex", alignItems: "center", gap: "6px",
              }}
            >
              📄 Export Report
            </button>
            <button
              onClick={() => setShowExecutiveModal(true)}
              style={{
                padding: "9px 16px", borderRadius: "12px",
                background: "var(--bg)", color: "var(--text)",
                border: "1px solid var(--border)", fontSize: "0.82rem",
                fontWeight: 700, cursor: "pointer",
                display: "inline-flex", alignItems: "center", gap: "6px",
              }}
            >
              📋 Executive Report
            </button>
            <button
              onClick={handleExportCSV}
              style={{
                padding: "9px 16px", borderRadius: "12px",
                background: "var(--bg)", color: "var(--text)",
                border: "1px solid var(--border)", fontSize: "0.82rem",
                fontWeight: 700, cursor: "pointer",
                display: "inline-flex", alignItems: "center", gap: "6px",
              }}
            >
              📥 Download CSV
            </button>
            <button
              onClick={handleCopyMarkdown}
              style={{
                padding: "9px 16px", borderRadius: "12px",
                background: "var(--bg)", color: "var(--text)",
                border: "1px solid var(--border)", fontSize: "0.82rem",
                fontWeight: 700, cursor: "pointer",
                display: "inline-flex", alignItems: "center", gap: "6px",
              }}
            >
              {copied ? "✓ Copied!" : "📋 Copy Markdown"}
            </button>
          </div>
        </div>

        {/* Top 4 KPI Cards */}
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(220px, 1fr))", gap: "16px", marginBottom: "20px" }}>
          {[
            { label: "COMPLETION VELOCITY", value: `${completionRate}%`, color: "var(--brand)", sub: `${statusCounts["Done"]} of ${total} items delivered` },
            { label: "IN-FLIGHT WORK", value: inFlightCount, color: "#f59e0b", sub: `${statusCounts["In Progress"]} in progress, ${statusCounts["Review"]} in review` },
            { label: "TOTAL WORK ITEMS", value: total, color: "var(--text)", sub: "Across all 4 sprint lanes" },
            { label: "OVERDUE TASKS", value: overdueTasks.length, color: overdueTasks.length > 0 ? "#ef4444" : "#10b981", sub: overdueTasks.length === 0 ? "All deadlines on track" : "Need immediate attention" },
          ].map((kpi) => (
            <div key={kpi.label} className="clay-card" style={{ padding: "20px", borderRadius: "16px", background: "var(--panel)", border: "1px solid var(--border)", boxShadow: "var(--shadow-soft)" }}>
              <span style={{ fontSize: "0.75rem", fontWeight: 700, color: "var(--text-muted)", textTransform: "uppercase" }}>{kpi.label}</span>
              <div style={{ fontSize: "2rem", fontWeight: 800, color: kpi.color, marginTop: "6px" }}>{kpi.value}</div>
              <span style={{ fontSize: "0.75rem", color: "var(--text-muted)" }}>{kpi.sub}</span>
            </div>
          ))}
        </div>

        {/* ── REAL CHART DATA: Status Bar + Timeline Line ─────────────────── */}
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(360px, 1fr))", gap: "20px", marginBottom: "20px" }}>

          {/* Tasks by Status — Bar Chart */}
          <div className="clay-card" style={{ padding: "20px", borderRadius: "16px", background: "var(--panel)", border: "1px solid var(--border)", boxShadow: "var(--shadow-soft)" }}>
            <h4 style={{ margin: "0 0 4px", fontSize: "0.95rem", fontWeight: 700, color: "var(--text)" }}>Tasks by Status</h4>
            <p style={{ margin: "0 0 14px", fontSize: "0.78rem", color: "var(--text-muted)" }}>Live count from API</p>
            <BarChart data={statusBarData} />
            <div style={{ display: "flex", flexWrap: "wrap", gap: "10px", marginTop: "12px" }}>
              {statusBarData.map((d) => (
                <div key={d.label} style={{ display: "flex", alignItems: "center", gap: "6px", fontSize: "0.78rem" }}>
                  <span style={{ width: "10px", height: "10px", borderRadius: "3px", background: d.color, display: "inline-block" }} />
                  {d.label}: <strong>{d.value}</strong>
                </div>
              ))}
            </div>
          </div>

          {/* Tasks over time — Line Chart */}
          <div className="clay-card" style={{ padding: "20px", borderRadius: "16px", background: "var(--panel)", border: "1px solid var(--border)", boxShadow: "var(--shadow-soft)" }}>
            <h4 style={{ margin: "0 0 4px", fontSize: "0.95rem", fontWeight: 700, color: "var(--text)" }}>Tasks per Due Date</h4>
            <p style={{ margin: "0 0 14px", fontSize: "0.78rem", color: "var(--text-muted)" }}>Grouped by due_date · ordered chronologically</p>
            <LineChart data={lineData} />
          </div>
        </div>

        {/* ── SPRINT VELOCITY CHART ─────────────────────────────────────────── */}
        <div className="clay-card" style={{ padding: "20px", borderRadius: "16px", background: "var(--panel)", border: "1px solid var(--border)", boxShadow: "var(--shadow-soft)", marginBottom: "20px" }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", flexWrap: "wrap", gap: "10px", marginBottom: "16px" }}>
            <div>
              <h4 style={{ margin: "0 0 2px", fontSize: "0.95rem", fontWeight: 700, color: "var(--text)" }}>⚡ Sprint Velocity</h4>
              <p style={{ margin: 0, fontSize: "0.78rem", color: "var(--text-muted)" }}>Planned vs Completed tasks per week · Last 4 weeks</p>
            </div>
            <div style={{ display: "flex", gap: "14px", fontSize: "0.78rem" }}>
              <span style={{ display: "flex", alignItems: "center", gap: "5px" }}>
                <span style={{ width: "12px", height: "12px", borderRadius: "3px", background: "#6366f1", display: "inline-block" }} /> Planned
              </span>
              <span style={{ display: "flex", alignItems: "center", gap: "5px" }}>
                <span style={{ width: "12px", height: "12px", borderRadius: "3px", background: "#10b981", display: "inline-block" }} /> Completed
              </span>
            </div>
          </div>
          <GroupedBarChart weeks={sprintWeeks} />
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(100px, 1fr))", gap: "10px", marginTop: "14px" }}>
            {sprintWeeks.map((w) => (
              <div key={w.label} style={{ textAlign: "center", padding: "10px", borderRadius: "10px", background: "var(--bg)", border: "1px solid var(--border)" }}>
                <div style={{ fontSize: "0.72rem", fontWeight: 700, color: "var(--text-muted)", marginBottom: "4px" }}>{w.label}</div>
                <div style={{ fontSize: "0.82rem", color: "#6366f1", fontWeight: 700 }}>{w.planned} planned</div>
                <div style={{ fontSize: "0.82rem", color: "#10b981", fontWeight: 700 }}>{w.done} done</div>
                <div style={{ fontSize: "0.72rem", color: "var(--text-muted)", marginTop: "2px" }}>
                  {w.planned > 0 ? Math.round((w.done / w.planned) * 100) : 0}% velocity
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* ── TEAM TIME REPORT ─────────────────────────────────────────────── */}
        <div className="clay-card" style={{ padding: "20px", borderRadius: "16px", background: "var(--panel)", border: "1px solid var(--border)", boxShadow: "var(--shadow-soft)", marginBottom: "20px" }}>
          <h4 style={{ margin: "0 0 4px", fontSize: "0.95rem", fontWeight: 700, color: "var(--text)" }}>🕐 Team Time Report</h4>
          <p style={{ margin: "0 0 16px", fontSize: "0.78rem", color: "var(--text-muted)" }}>
            Estimated hours worked per member · based on task count × 2h
          </p>
          {teamRows.length === 0 ? (
            <p style={{ color: "var(--text-muted)", fontSize: "0.84rem" }}>No team members found for this project.</p>
          ) : (
            <div style={{ display: "flex", flexDirection: "column", gap: "12px" }}>
              {teamRows.map((row) => {
                const pct = Math.round((row.estHours / maxHours) * 100);
                return (
                  <div key={row.name} style={{ display: "flex", alignItems: "center", gap: "14px", padding: "12px 16px", borderRadius: "12px", background: "var(--bg)", border: "1px solid var(--border)" }}>
                    {/* Avatar */}
                    <div style={{
                      width: "36px", height: "36px", borderRadius: "50%", flexShrink: 0,
                      background: "linear-gradient(135deg, #6366f1, #8b5cf6)",
                      display: "flex", alignItems: "center", justifyContent: "center",
                      color: "#fff", fontWeight: 800, fontSize: "0.82rem",
                    }}>
                      {row.name.slice(0, 1).toUpperCase()}
                    </div>
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div style={{ display: "flex", justifyContent: "space-between", marginBottom: "5px" }}>
                        <span style={{ fontWeight: 700, fontSize: "0.85rem", color: "var(--text)" }}>{row.name}</span>
                        <span style={{ fontSize: "0.78rem", color: "var(--text-muted)" }}>
                          ~{row.estHours}h · {row.taskCount} task{row.taskCount !== 1 ? "s" : ""}
                        </span>
                      </div>
                      <div style={{ height: "8px", borderRadius: "4px", background: "var(--border)", overflow: "hidden" }}>
                        <div style={{
                          width: `${pct}%`, height: "100%",
                          background: "linear-gradient(90deg, #6366f1, #10b981)",
                          borderRadius: "4px", transition: "width 0.6s ease",
                        }} />
                      </div>
                    </div>
                    <div style={{ fontSize: "0.78rem", fontWeight: 700, color: "var(--brand)", minWidth: "36px", textAlign: "right" }}>
                      {pct}%
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* Priority Distribution + Kanban Distribution */}
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(360px, 1fr))", gap: "20px", marginBottom: "20px" }}>
          {/* Kanban Distribution */}
          <div className="clay-card" style={{ padding: "20px", borderRadius: "16px", background: "var(--panel)", border: "1px solid var(--border)", boxShadow: "var(--shadow-soft)" }}>
            <h4 style={{ margin: "0 0 14px", fontSize: "0.95rem", fontWeight: 700, color: "var(--text)" }}>Kanban Column Distribution</h4>
            <div style={{ height: "14px", borderRadius: "7px", overflow: "hidden", display: "flex", background: "var(--bg)", border: "1px solid var(--border)", marginBottom: "14px" }}>
              <div style={{ width: `${(statusCounts["To Do"] / (total || 1)) * 100}%`, background: "#3b82f6" }} title={`To Do: ${statusCounts["To Do"]}`} />
              <div style={{ width: `${(statusCounts["In Progress"] / (total || 1)) * 100}%`, background: "#f59e0b" }} title={`In Progress: ${statusCounts["In Progress"]}`} />
              <div style={{ width: `${(statusCounts["Review"] / (total || 1)) * 100}%`, background: "#8b5cf6" }} title={`Review: ${statusCounts["Review"]}`} />
              <div style={{ width: `${(statusCounts["Done"] / (total || 1)) * 100}%`, background: "#10b981" }} title={`Done: ${statusCounts["Done"]}`} />
            </div>
            <div style={{ display: "grid", gridTemplateColumns: "repeat(2, 1fr)", gap: "10px" }}>
              {[["To Do", "#3b82f6"], ["In Progress", "#f59e0b"], ["Review", "#8b5cf6"], ["Done", "#10b981"]].map(([label, color]) => (
                <div key={label} style={{ display: "flex", alignItems: "center", gap: "8px", fontSize: "0.82rem" }}>
                  <span style={{ width: "10px", height: "10px", borderRadius: "50%", background: color, flexShrink: 0 }} />
                  <span>{label}: <strong>{statusCounts[label]}</strong></span>
                </div>
              ))}
            </div>
          </div>

          {/* Priority Distribution */}
          <div className="clay-card" style={{ padding: "20px", borderRadius: "16px", background: "var(--panel)", border: "1px solid var(--border)", boxShadow: "var(--shadow-soft)" }}>
            <h4 style={{ margin: "0 0 14px", fontSize: "0.95rem", fontWeight: 700, color: "var(--text)" }}>Priority Distribution</h4>
            <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: "12px" }}>
              <div style={{ padding: "12px", borderRadius: "12px", background: "var(--high-bg)", borderLeft: "4px solid var(--high-text)" }}>
                <div style={{ fontSize: "0.72rem", fontWeight: 700, color: "var(--high-text)", textTransform: "uppercase" }}>HIGH</div>
                <div style={{ fontSize: "1.4rem", fontWeight: 800, color: "var(--high-text)", marginTop: "4px" }}>{priorityCounts.High}</div>
              </div>
              <div style={{ padding: "12px", borderRadius: "12px", background: "var(--medium-bg)", borderLeft: "4px solid var(--medium-text)" }}>
                <div style={{ fontSize: "0.72rem", fontWeight: 700, color: "var(--medium-text)", textTransform: "uppercase" }}>MEDIUM</div>
                <div style={{ fontSize: "1.4rem", fontWeight: 800, color: "var(--medium-text)", marginTop: "4px" }}>{priorityCounts.Medium}</div>
              </div>
              <div style={{ padding: "12px", borderRadius: "12px", background: "var(--low-bg)", borderLeft: "4px solid var(--low-text)" }}>
                <div style={{ fontSize: "0.72rem", fontWeight: 700, color: "var(--low-text)", textTransform: "uppercase" }}>LOW</div>
                <div style={{ fontSize: "1.4rem", fontWeight: 800, color: "var(--low-text)", marginTop: "4px" }}>{priorityCounts.Low}</div>
              </div>
            </div>
          </div>
        </div>

        {/* Task Register Table */}
        <div className="clay-card" style={{ padding: "20px", borderRadius: "16px", background: "var(--panel)", border: "1px solid var(--border)", boxShadow: "var(--shadow-soft)" }}>
          <h4 style={{ margin: "0 0 14px", fontSize: "0.95rem", fontWeight: 700, color: "var(--text)" }}>📋 Comprehensive Task Register</h4>
          <div style={{ overflowX: "auto" }}>
            <table style={{ width: "100%", borderCollapse: "collapse", fontSize: "0.82rem" }}>
              <thead>
                <tr style={{ borderBottom: "1px solid var(--border)", textAlign: "left", color: "var(--text-muted)" }}>
                  <th style={{ padding: "10px" }}>Task Title</th>
                  <th style={{ padding: "10px" }}>Stage</th>
                  <th style={{ padding: "10px" }}>Priority</th>
                  <th style={{ padding: "10px" }}>Assignee</th>
                  <th style={{ padding: "10px" }}>Target Due Date</th>
                </tr>
              </thead>
              <tbody>
                {tasks.map((t) => (
                  <tr key={t.id} style={{ borderBottom: "1px solid var(--border)" }}>
                    <td style={{ padding: "10px", fontWeight: 600, color: "var(--text)" }}>{t.title}</td>
                    <td style={{ padding: "10px" }}>
                      <span style={{
                        padding: "3px 8px", borderRadius: "9999px", fontSize: "0.72rem", fontWeight: 700,
                        background: t.status === "Done" ? "#dcfce7" : t.status === "Review" ? "#f3e8ff" : t.status === "In Progress" ? "#fef3c7" : "#e0e7ff",
                        color: t.status === "Done" ? "#15803d" : t.status === "Review" ? "#7e22ce" : t.status === "In Progress" ? "#b45309" : "#3730a3",
                      }}>
                        {t.status}
                      </span>
                    </td>
                    <td style={{ padding: "10px" }}>
                      <span style={{
                        padding: "3px 8px", borderRadius: "6px", fontSize: "0.72rem", fontWeight: 700,
                        background: t.priority_level?.toLowerCase() === "high" ? "var(--high-bg)" : t.priority_level?.toLowerCase() === "medium" ? "var(--medium-bg)" : "var(--low-bg)",
                        color: t.priority_level?.toLowerCase() === "high" ? "var(--high-text)" : t.priority_level?.toLowerCase() === "medium" ? "var(--medium-text)" : "var(--low-text)",
                      }}>
                        {t.priority_level || "Medium"}
                      </span>
                    </td>
                    <td style={{ padding: "10px", color: "var(--text-muted)" }}>{t.user_username || "Unassigned"}</td>
                    <td style={{ padding: "10px", color: "var(--text-muted)" }}>{t.due_date || "—"}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* Executive Report Modal */}
        {showExecutiveModal && (
          <ExecutiveReportModal
            project={project}
            tasks={tasks}
            onClose={() => setShowExecutiveModal(false)}
          />
        )}
      </div>
    </>
  );
}

export default AnalyticsView;

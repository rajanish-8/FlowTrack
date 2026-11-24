import { useState } from "react";

function DocumentationView() {
  const [activeCategory, setActiveCategory] = useState("all");
  const [selectedDiagram, setSelectedDiagram] = useState(null);

  const presentations = [
    {
      id: "pres1",
      code: "Pres-1",
      title: "Project Synopsis & Inception",
      phase: "Milestone 1 • Problem Formulation & Feasibility",
      slides: 12,
      date: "August 2026",
      topics: [
        "Domain problem statement & modern agile friction points",
        "Survey of Jira, Trello, Asana & Monday.com bottlenecks",
        "5-tier modular full-stack software architecture",
        "Economic, operational, and technical feasibility matrix",
        "14-week Work Breakdown Structure (WBS) & sprint plan"
      ],
      pptx: "/documentation/FlowTrack_Pres1_Synopsis.pptx",
      sizePptx: "1.73 MB"
    },
    {
      id: "pres2",
      code: "Pres-2",
      title: "Requirements Engineering & SRS",
      phase: "Milestone 2 • Elicitation, FRs/NFRs & DFDs",
      slides: 12,
      date: "September 2026",
      topics: [
        "Requirement elicitation via developer interviews & surveys",
        "Role-based privilege matrix (Owner, Manager, Member, Guest)",
        "FR-01 to FR-18 functional specifications with state rules",
        "IEEE 830 non-functional constraints (<100ms API, 99.9% uptime)",
        "DFD Level 0 Context & Level 1 decomposed process models"
      ],
      pptx: "/documentation/FlowTrack_Pres2_Requirement_Engineering.pptx",
      sizePptx: "1.73 MB"
    },
    {
      id: "pres3",
      code: "Pres-3",
      title: "System Architecture, DB & GUI Design",
      phase: "Milestone 3 • High-Level Architecture & Schemas",
      slides: 12,
      date: "October 2026",
      topics: [
        "5-layer clean architectural model & decoupled boundary API",
        "Finite State Machine task lifecycle & state transitions",
        "Crow's Foot Relational ER schema & 3NF normalization proofs",
        "Field-level data dictionary & cascade integrity constraints",
        "Ergonomic multi-perspective GUI (Kanban, Calendar, Table, Matrix)"
      ],
      pptx: "/documentation/FlowTrack_Pres3_Design_DB_and_GUI.pptx",
      sizePptx: "1.73 MB"
    },
    {
      id: "pres4",
      code: "Pres-4",
      title: "Implementation, Coding & Testing",
      phase: "Milestone 4 • Algorithmic Core & Test Verification",
      slides: 12,
      date: "November 2026",
      topics: [
        "React 19 + Django REST Framework decoupled stack",
        "Fractional indexing string algorithm for O(1) card reordering",
        "Optimistic UI reconciliation with auto rollback on fault",
        "Monotonic interval timer engine with requestAnimationFrame",
        "20 formal verification test cases with 100% pass rate"
      ],
      pptx: "/documentation/FlowTrack_Pres4_Coding_and_Testing.pptx",
      sizePptx: "1.73 MB"
    },
    {
      id: "pres5",
      code: "Pres-5",
      title: "Product Evaluation & Final Defense",
      phase: "Milestone 5 • Telemetry, Usability & Submission",
      slides: 13,
      date: "November 2026",
      topics: [
        "Executive platform delivery & verified real-world screenshots",
        "Quantitative benchmarks (<32ms DND latency, <98ms API response)",
        "Nielsen Norman 10 Usability Heuristics audit (SUS Score 88.5 / A+)",
        "Individual team contribution RACI responsibility matrix",
        "14-week schedule adherence audit & FlowTrack v2.0 roadmap"
      ],
      pptx: "/documentation/FlowTrack_Pres5_Product_Evaluation_and_Submission.pptx",
      sizePptx: "1.72 MB"
    }
  ];

  const academicReports = [
    {
      id: "report",
      code: "DOC-01",
      title: "Major Project Final Report",
      pages: "72 Pages (Fully Justified)",
      standard: "Department of CSE, Medi-Caps University Format",
      format: "Microsoft Word .docx + Submission PDF",
      description:
        "The official, exhaustive academic project report covering all 7 chapters: Introduction, Literature Survey, System Requirements, System Design, Implementation & Code Listings, Testing & Verification, and Conclusion & Future Scope. Features 23 embedded high-resolution diagrams and 9 real UI captures.",
      docx: "/documentation/FlowTrack_Project_Final_Report.docx",
      pdf: "/documentation/FlowTrack_Project_Final_Report.pdf",
      sizeDocx: "12.85 MB",
      sizePdf: "1.04 MB"
    }
  ];

  const diagrams = [
    { name: "5-Tier System Architecture", file: "fig_3_1_system_architecture.png", category: "Architecture" },
    { name: "DFD Level 0 (Context Diagram)", file: "fig_3_2_dfd_level_0.png", category: "Data Flow" },
    { name: "DFD Level 1 (Decomposed Processes)", file: "fig_3_4_dfd_level_1.png", category: "Data Flow" },
    { name: "UML Use Case Specification", file: "fig_3_2_use_case_diagram.png", category: "UML" },
    { name: "UML Class Model", file: "fig_3_6_class_diagram.png", category: "UML" },
    { name: "Crow's Foot Relational ER Schema", file: "fig_3_7_er_diagram.png", category: "Database" },
    { name: "UML Sequence Diagram", file: "fig_3_8_sequence_diagram.png", category: "UML" },
    { name: "FSM State Machine Lifecycle", file: "fig_3_10_state_machine_diagram.png", category: "Architecture" },
    { name: "Component & Deployment Diagram", file: "fig_3_11_component_deployment_diagram.png", category: "Architecture" }
  ];

  return (
    <div style={{ maxWidth: "1280px", margin: "0 auto", padding: "10px 16px 40px" }}>
      {/* Top Banner */}
      <div
        className="clay-card"
        style={{
          padding: "24px 28px",
          borderRadius: "20px",
          background: "var(--panel)",
          border: "1px solid var(--border)",
          boxShadow: "var(--shadow-soft)",
          marginBottom: "24px",
          position: "relative",
          overflow: "hidden"
        }}
      >
        <div style={{ display: "flex", flexWrap: "wrap", alignItems: "center", justifyContent: "space-between", gap: "16px" }}>
          <div>
            <div style={{ display: "flex", alignItems: "center", gap: "8px", marginBottom: "6px" }}>
              <span
                style={{
                  fontSize: "0.72rem",
                  fontWeight: 800,
                  textTransform: "uppercase",
                  background: "linear-gradient(135deg, #4f46e5 0%, #7c3aed 100%)",
                  color: "#fff",
                  padding: "3px 10px",
                  borderRadius: "9999px",
                  letterSpacing: "0.05em"
                }}
              >
                Medi-Caps University Standard
              </span>
              <span style={{ fontSize: "0.75rem", color: "var(--text-muted)" }}>
                Department of Computer Science & Engineering
              </span>
            </div>
            <h2 style={{ margin: "0 0 6px", fontSize: "1.5rem", fontWeight: 800, color: "var(--text)" }}>
              📑 Documentation & Milestone Presentations Hub
            </h2>
            <p style={{ margin: 0, fontSize: "0.88rem", color: "var(--text-muted)" }}>
              Supervisor: <strong>Mr. Pradeep Kumar Mehta</strong> • Authors:{" "}
              <strong>Priyanshu Choudhary, Rajanish Kumrawat, Priyanshu Tiwari</strong>
            </p>
          </div>

          {/* Quick Access Badges */}
          <div style={{ display: "flex", gap: "10px", flexWrap: "wrap" }}>
            <div
              style={{
                padding: "8px 14px",
                borderRadius: "12px",
                background: "var(--bg)",
                border: "1px solid var(--border)",
                textAlign: "center"
              }}
            >
              <div style={{ fontSize: "1.1rem", fontWeight: 800, color: "var(--brand)" }}>5</div>
              <div style={{ fontSize: "0.68rem", fontWeight: 700, color: "var(--text-muted)", textTransform: "uppercase" }}>
                Presentations
              </div>
            </div>
            <div
              style={{
                padding: "8px 14px",
                borderRadius: "12px",
                background: "var(--bg)",
                border: "1px solid var(--border)",
                textAlign: "center"
              }}
            >
              <div style={{ fontSize: "1.1rem", fontWeight: 800, color: "#10b981" }}>72</div>
              <div style={{ fontSize: "0.68rem", fontWeight: 700, color: "var(--text-muted)", textTransform: "uppercase" }}>
                Report Pages
              </div>
            </div>
            <div
              style={{
                padding: "8px 14px",
                borderRadius: "12px",
                background: "var(--bg)",
                border: "1px solid var(--border)",
                textAlign: "center"
              }}
            >
              <div style={{ fontSize: "1.1rem", fontWeight: 800, color: "#8b5cf6" }}>23</div>
              <div style={{ fontSize: "0.68rem", fontWeight: 700, color: "var(--text-muted)", textTransform: "uppercase" }}>
                HD Diagrams
              </div>
            </div>
          </div>
        </div>

        {/* Category Filters */}
        <div style={{ display: "flex", gap: "8px", marginTop: "20px", flexWrap: "wrap", borderTop: "1px solid var(--border)", paddingTop: "16px" }}>
          {[
            { id: "all", label: "🌟 All Assets" },
            { id: "presentations", label: "📊 Milestone Presentations (Pres 1–5)" },
            { id: "reports", label: "📄 Final Project Report" },
            { id: "diagrams", label: "📐 Architecture & UML Diagrams" }
          ].map((cat) => (
            <button
              key={cat.id}
              onClick={() => setActiveCategory(cat.id)}
              style={{
                padding: "6px 14px",
                borderRadius: "9999px",
                fontSize: "0.82rem",
                fontWeight: 700,
                border: activeCategory === cat.id ? "1px solid var(--brand)" : "1px solid var(--border)",
                background: activeCategory === cat.id ? "var(--brand)" : "var(--bg)",
                color: activeCategory === cat.id ? "#fff" : "var(--text)",
                cursor: "pointer",
                transition: "all 0.15s ease"
              }}
            >
              {cat.label}
            </button>
          ))}
        </div>
      </div>

      {/* 1. Milestone Presentations Section */}
      {(activeCategory === "all" || activeCategory === "presentations") && (
        <section style={{ marginBottom: "32px" }}>
          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: "16px" }}>
            <h3 style={{ margin: 0, fontSize: "1.2rem", fontWeight: 800, color: "var(--text)", display: "flex", alignItems: "center", gap: "8px" }}>
              📊 Phase-Specific Milestone Presentations (Pres-1 to Pres-5)            </h3>
            <span style={{ fontSize: "0.78rem", color: "var(--text-muted)", fontWeight: 600 }}>
              Metropolis Font • Official University Standard
            </span>
          </div>

          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(360px, 1fr))", gap: "18px" }}>
            {presentations.map((p) => (
              <div
                key={p.id}
                className="clay-card"
                style={{
                  borderRadius: "16px",
                  background: "var(--panel)",
                  border: "1px solid var(--border)",
                  padding: "20px",
                  boxShadow: "var(--shadow-soft)",
                  display: "flex",
                  flexDirection: "column",
                  justifyContent: "space-between",
                  transition: "transform 0.18s ease, box-shadow 0.18s ease"
                }}
              >
                <div>
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: "10px" }}>
                    <span
                      style={{
                        fontSize: "0.72rem",
                        fontWeight: 800,
                        padding: "3px 8px",
                        borderRadius: "6px",
                        background: "rgba(99, 102, 241, 0.12)",
                        color: "var(--brand)",
                        border: "1px solid rgba(99, 102, 241, 0.25)"
                      }}
                    >
                      {p.code}
                    </span>
                    <span
                      style={{
                        fontSize: "0.72rem",
                        fontWeight: 700,
                        padding: "3px 8px",
                        borderRadius: "9999px",
                        background: "var(--bg)",
                        color: "var(--text-muted)",
                        border: "1px solid var(--border)"
                      }}
                    >
                      {p.slides} Slides
                    </span>
                  </div>

                  <h4 style={{ margin: "0 0 6px", fontSize: "1.05rem", fontWeight: 700, color: "var(--text)" }}>
                    {p.title}
                  </h4>
                  <p style={{ margin: "0 0 12px", fontSize: "0.78rem", color: "var(--text-muted)", fontWeight: 600 }}>
                    {p.phase}
                  </p>

                  <ul style={{ margin: "0 0 16px", paddingLeft: "16px", fontSize: "0.78rem", color: "var(--text)", lineHeight: 1.5 }}>
                    {p.topics.map((t, idx) => (
                      <li key={idx} style={{ marginBottom: "4px" }}>
                        {t}
                      </li>
                    ))}
                  </ul>
                </div>

                <div
                  style={{
                    display: "flex",
                    gap: "8px",
                    borderTop: "1px solid var(--border)",
                    paddingTop: "14px",
                    marginTop: "auto"
                  }}
                >
                  <a
                    href={p.pptx}
                    download
                    style={{
                      flex: 1,
                      textAlign: "center",
                      padding: "8px 12px",
                      borderRadius: "10px",
                      background: "linear-gradient(135deg, #2563eb 0%, #1d4ed8 100%)",
                      color: "#fff",
                      textDecoration: "none",
                      fontSize: "0.78rem",
                      fontWeight: 700,
                      boxShadow: "0 2px 6px rgba(37, 99, 235, 0.3)"
                    }}
                  >
                    📥 Download PPTX ({p.sizePptx})
                  </a>
                </div>
              </div>
            ))}
          </div>
        </section>
      )}

      {/* 2. Official Academic Reports Section */}
      {(activeCategory === "all" || activeCategory === "reports") && (
        <section style={{ marginBottom: "32px" }}>
          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: "16px" }}>
            <h3 style={{ margin: 0, fontSize: "1.2rem", fontWeight: 800, color: "var(--text)", display: "flex", alignItems: "center", gap: "8px" }}>
              📄 Official Major Project Final Report
            </h3>
            <span style={{ fontSize: "0.78rem", color: "var(--text-muted)", fontWeight: 600 }}>
              Fully Justified • Formal IEEE & University Templates
            </span>
          </div>

          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(360px, 1fr))", gap: "18px" }}>
            {academicReports.map((r) => (
              <div
                key={r.id}
                className="clay-card"
                style={{
                  borderRadius: "16px",
                  background: "var(--panel)",
                  border: "1px solid var(--border)",
                  padding: "20px",
                  boxShadow: "var(--shadow-soft)",
                  display: "flex",
                  flexDirection: "column",
                  justifyContent: "space-between"
                }}
              >
                <div>
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: "10px" }}>
                    <span
                      style={{
                        fontSize: "0.72rem",
                        fontWeight: 800,
                        padding: "3px 8px",
                        borderRadius: "6px",
                        background: "rgba(16, 185, 129, 0.12)",
                        color: "#059669",
                        border: "1px solid rgba(16, 185, 129, 0.25)"
                      }}
                    >
                      {r.code}
                    </span>
                    <span
                      style={{
                        fontSize: "0.72rem",
                        fontWeight: 700,
                        padding: "3px 8px",
                        borderRadius: "9999px",
                        background: "var(--bg)",
                        color: "var(--text-muted)",
                        border: "1px solid var(--border)"
                      }}
                    >
                      {r.pages}
                    </span>
                  </div>

                  <h4 style={{ margin: "0 0 4px", fontSize: "1.05rem", fontWeight: 700, color: "var(--text)" }}>
                    {r.title}
                  </h4>
                  <p style={{ margin: "0 0 10px", fontSize: "0.78rem", color: "var(--text-muted)", fontWeight: 600 }}>
                    Standard: {r.standard}
                  </p>
                  <p style={{ margin: "0 0 16px", fontSize: "0.82rem", color: "var(--text)", lineHeight: 1.55 }}>
                    {r.description}
                  </p>
                </div>

                <div
                  style={{
                    display: "flex",
                    gap: "8px",
                    borderTop: "1px solid var(--border)",
                    paddingTop: "14px",
                    marginTop: "auto"
                  }}
                >
                  <a
                    href={r.pdf}
                    target="_blank"
                    rel="noopener noreferrer"
                    style={{
                      flex: 1,
                      textAlign: "center",
                      padding: "8px 12px",
                      borderRadius: "10px",
                      background: "linear-gradient(135deg, #059669 0%, #047857 100%)",
                      color: "#fff",
                      textDecoration: "none",
                      fontSize: "0.78rem",
                      fontWeight: 700,
                      boxShadow: "0 2px 6px rgba(5, 150, 105, 0.3)"
                    }}
                  >
                    📄 View PDF ({r.sizePdf})
                  </a>
                  <a
                    href={r.docx}
                    download
                    style={{
                      flex: 1,
                      textAlign: "center",
                      padding: "8px 12px",
                      borderRadius: "10px",
                      background: "var(--bg)",
                      color: "var(--text)",
                      border: "1px solid var(--border)",
                      textDecoration: "none",
                      fontSize: "0.78rem",
                      fontWeight: 700
                    }}
                  >
                    📥 DOCX ({r.sizeDocx})
                  </a>
                </div>
              </div>
            ))}
          </div>
        </section>
      )}

      {/* 3. System Architecture & Diagrams Gallery */}
      {(activeCategory === "all" || activeCategory === "diagrams") && (
        <section style={{ marginBottom: "20px" }}>
          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: "16px" }}>
            <h3 style={{ margin: 0, fontSize: "1.2rem", fontWeight: 800, color: "var(--text)", display: "flex", alignItems: "center", gap: "8px" }}>
              📐 Architectural & UML Diagrams Gallery (High-Res 300 DPI)
            </h3>
            <span style={{ fontSize: "0.78rem", color: "var(--text-muted)", fontWeight: 600 }}>
              Click any diagram to inspect full high-resolution image
            </span>
          </div>

          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(260px, 1fr))", gap: "16px" }}>
            {diagrams.map((d, idx) => (
              <div
                key={idx}
                className="clay-card"
                onClick={() => setSelectedDiagram(d)}
                style={{
                  borderRadius: "14px",
                  background: "var(--panel)",
                  border: "1px solid var(--border)",
                  overflow: "hidden",
                  cursor: "pointer",
                  boxShadow: "var(--shadow-soft)",
                  transition: "transform 0.15s ease, box-shadow 0.15s ease"
                }}
              >
                <div
                  style={{
                    height: "150px",
                    background: "var(--bg)",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    overflow: "hidden",
                    borderBottom: "1px solid var(--border)",
                    padding: "8px"
                  }}
                >
                  <img
                    src={`/documentation/diagrams/${d.file}`}
                    alt={d.name}
                    style={{
                      maxWidth: "100%",
                      maxHeight: "100%",
                      objectFit: "contain",
                      transition: "transform 0.2s"
                    }}
                  />
                </div>
                <div style={{ padding: "12px 14px" }}>
                  <span
                    style={{
                      fontSize: "0.68rem",
                      fontWeight: 700,
                      textTransform: "uppercase",
                      color: "var(--brand)",
                      background: "rgba(99, 102, 241, 0.1)",
                      padding: "2px 6px",
                      borderRadius: "4px"
                    }}
                  >
                    {d.category}
                  </span>
                  <div style={{ fontSize: "0.85rem", fontWeight: 700, color: "var(--text)", marginTop: "4px" }}>
                    {d.name}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </section>
      )}

      {/* Lightbox Modal */}
      {selectedDiagram && (
        <div
          onClick={() => setSelectedDiagram(null)}
          style={{
            position: "fixed",
            inset: 0,
            background: "rgba(0, 0, 0, 0.82)",
            backdropFilter: "blur(8px)",
            zIndex: 9999,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            padding: "20px"
          }}
        >
          <div
            onClick={(e) => e.stopPropagation()}
            style={{
              maxWidth: "92vw",
              maxHeight: "92vh",
              background: "var(--panel)",
              borderRadius: "18px",
              padding: "20px",
              boxShadow: "0 20px 60px rgba(0,0,0,0.5)",
              display: "flex",
              flexDirection: "column",
              border: "1px solid var(--border)"
            }}
          >
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "14px" }}>
              <div>
                <h3 style={{ margin: 0, fontSize: "1.1rem", color: "var(--text)" }}>{selectedDiagram.name}</h3>
                <span style={{ fontSize: "0.75rem", color: "var(--text-muted)" }}>
                  Category: {selectedDiagram.category} • High-Resolution Architectural Vector
                </span>
              </div>
              <button
                onClick={() => setSelectedDiagram(null)}
                style={{
                  background: "var(--bg)",
                  border: "1px solid var(--border)",
                  borderRadius: "50%",
                  width: "32px",
                  height: "32px",
                  cursor: "pointer",
                  fontSize: "1.1rem",
                  color: "var(--text)"
                }}
              >
                ×
              </button>
            </div>
            <div style={{ overflow: "auto", maxHeight: "80vh", textAlign: "center", background: "#ffffff", padding: "16px", borderRadius: "12px" }}>
              <img
                src={`/documentation/diagrams/${selectedDiagram.file}`}
                alt={selectedDiagram.name}
                style={{ maxWidth: "100%", height: "auto", borderRadius: "8px" }}
              />
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default DocumentationView;

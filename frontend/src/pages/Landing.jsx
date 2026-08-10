import "../login.css";
import { useNavigate } from "react-router-dom";
import logoAsset from "../assets/flowtrack-logo.svg";
import defaultAvatar from "../assets/default-avatar.svg";

function Landing() {
  const navigate = useNavigate();
  const isSignedIn = Boolean(localStorage.getItem("token"));

  return (
    <div className="landing-page">
      <header className="landing-nav clay-card">
        <button className="landing-brand" onClick={() => navigate("/")} aria-label="FlowTrack home">
          <img src={logoAsset} alt="FlowTrack logo" />
          <span>FlowTrack</span>
        </button>
        <nav className="landing-links" aria-label="Landing page sections">
          <a href="#workflow">Workflow</a>
          <a href="#roles">Roles</a>
          <a href="#features">Features</a>
        </nav>
        <div className="landing-actions">
          <button className="btn clay-button" onClick={() => navigate("/login")}>Sign in</button>
          <button className="btn clay-button" onClick={() => navigate("/login")}>Sign in as a member</button>
          <button className="btn primary clay-button" onClick={() => navigate(isSignedIn ? "/board" : "/create-organization")}>
            {isSignedIn ? "Open Board" : "Create an organization"}
          </button>
        </div>
      </header>

      <main>
        <section className="landing-hero">
          <div className="hero-clay-card clay-card">
            <span className="eyebrow">Project delivery workspace</span>
            <h1>Move team tasks from plan to done with clarity.</h1>
            <p>
              FlowTrack gives admins, managers, and members a clean Kanban workspace for projects,
              assignments, priorities, and organization-aware progress.
            </p>
            <div className="hero-actions">
              <button className="btn primary clay-button" onClick={() => navigate(isSignedIn ? "/board" : "/create-organization")}>
                {isSignedIn ? "Open Your Board" : "Create an Organization"}
              </button>
              <button className="btn clay-button" onClick={() => navigate("/login")}>Sign In as a Member</button>
            </div>
          </div>

          <div className="board-preview-clay clay-card" aria-label="FlowTrack Kanban board preview">
            <div className="preview-topbar">
              <div>
                <span className="preview-kicker">Live board</span>
                <strong>Launch Sprint</strong>
              </div>
              <div className="preview-avatars">
                <img src={defaultAvatar} alt="" />
                <img src={defaultAvatar} alt="" />
                <img src={defaultAvatar} alt="" />
              </div>
            </div>
            <div className="mini-stats">
              <span>12 tasks</span>
              <span>4 in progress</span>
              <span>67% done</span>
            </div>
            <div className="mini-board">
              {["To Do", "In Progress", "Review"].map((column, index) => (
                <div className="mini-column" key={column}>
                  <div className="mini-column-title">
                    <span>{column}</span>
                    <strong>{index + 2}</strong>
                  </div>
                  <div className="mini-task-card">
                    <span className={`mini-priority priority-${index}`}>{index === 0 ? "High" : index === 1 ? "Medium" : "Low"}</span>
                    <strong>{index === 0 ? "Create launch assets" : index === 1 ? "Connect API flow" : "Review board polish"}</strong>
                    <small>{index === 0 ? "Owner" : index === 1 ? "Manager" : "Member"}</small>
                  </div>
                  <div className="mini-task-card muted-card">
                    <strong>{index === 0 ? "Invite team" : index === 1 ? "Assign due dates" : "Final QA"}</strong>
                    <small>Due this week</small>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </section>

        <section className="feature-strip" id="workflow">
          <article className="clay-card landing-feature-card">
            <span>01</span>
            <h2>Create projects</h2>
            <p>Organization Owners create a workspace, organize projects, and add the right people.</p>
          </article>
          <article className="clay-card landing-feature-card">
            <span>02</span>
            <h2>Assign tasks</h2>
            <p>Managers create tasks with owners, priorities, due dates, and clear status lanes.</p>
          </article>
          <article className="clay-card landing-feature-card">
            <span>03</span>
            <h2>Track delivery</h2>
            <p>Members move assigned work through To Do, In Progress, Review, and Done.</p>
          </article>
        </section>

        <section className="role-showcase" id="roles">
          <div className="section-heading">
            <span className="eyebrow">Role-aware access</span>
            <h2>Every user gets the controls they need.</h2>
          </div>
          <div className="role-grid">
            {[
              ["Organization Owner", "Manage organization details, members, roles, projects, and all tasks."],
              ["Manager", "Create and update tasks for assigned project work."],
              ["Member", "View the board and move only assigned tasks."],
            ].map(([role, text]) => (
              <article className="clay-card role-card" key={role}>
                <h3>{role}</h3>
                <p>{text}</p>
              </article>
            ))}
          </div>
        </section>

        <section className="feature-grid" id="features">
          {["Drag and drop Kanban", "Project member roles", "Profile pictures", "Priority and due dates"].map((feature) => (
            <div className="clay-card feature-pill" key={feature}>{feature}</div>
          ))}
        </section>
      </main>
    </div>
  );
}

export default Landing;

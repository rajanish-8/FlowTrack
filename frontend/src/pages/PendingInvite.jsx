import "../login.css";
import { useNavigate } from "react-router-dom";
import logoAsset from "../assets/flowtrack-logo.svg";

function PendingInvite() {
  const navigate = useNavigate();

  const logout = () => {
    localStorage.removeItem("token");
    navigate("/");
  };

  return (
    <div className="login-page auth-clay-page">
      <header className="login-header clay-card">
        <button className="login-brand brand-button" onClick={() => navigate("/")} aria-label="FlowTrack home">
          <img src={logoAsset} alt="FlowTrack logo" />
          <span>FlowTrack</span>
        </button>
        <div className="login-cta">
          <button className="btn clay-button" onClick={logout}>Sign out</button>
        </div>
      </header>

      <main className="login-hero auth-clay-layout">
        <section className="hero-copy clay-card auth-story-card">
          <span className="eyebrow">Waiting for organization access</span>
          <h1>Your account is ready. Your workspace invite is next.</h1>
          <p>
            Ask your Organization Owner to add your email to their workspace as a Manager
            or Member. After they add you, sign in again or refresh the board.
          </p>
          <div className="hero-actions">
            <button className="btn primary clay-button" onClick={() => navigate("/board")}>Check Again</button>
            <button className="btn clay-button" onClick={() => navigate("/create-organization")}>Create Organization</button>
          </div>
        </section>
      </main>
    </div>
  );
}

export default PendingInvite;

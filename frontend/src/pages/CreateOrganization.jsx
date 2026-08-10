import "../login.css";
import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import logoAsset from "../assets/flowtrack-logo.svg";
import { API_BASE_URL, organizationAPI } from "../utils/api";

function CreateOrganization() {
  const navigate = useNavigate();
  const [step, setStep] = useState(localStorage.getItem("token") ? "organization" : "account");
  const [submitting, setSubmitting] = useState(false);
  const [feedback, setFeedback] = useState("");
  const [accountForm, setAccountForm] = useState({
    firstName: "",
    lastName: "",
    email: "",
    password: "",
    skills: "",
  });
  const [organizationForm, setOrganizationForm] = useState({
    name: "",
    description: "",
  });

  useEffect(() => {
    const checkOrganization = async () => {
      if (!localStorage.getItem("token")) return;
      try {
        const data = await organizationAPI.getCurrent();
        if (!data.onboarding_required) {
          navigate("/board");
        }
      } catch {
        localStorage.removeItem("token");
        setStep("account");
      }
    };
    checkOrganization();
  }, [navigate]);

  const updateAccount = (event) => {
    const { name, value } = event.target;
    setAccountForm((prev) => ({ ...prev, [name]: value }));
  };

  const updateOrganization = (event) => {
    const { name, value } = event.target;
    setOrganizationForm((prev) => ({ ...prev, [name]: value }));
  };

  const submitAccount = async (event) => {
    event.preventDefault();
    if (submitting) return;
    setSubmitting(true);
    setFeedback("Creating your owner account...");

    const signupData = new FormData();
    signupData.append("first_name", accountForm.firstName);
    signupData.append("last_name", accountForm.lastName);
    signupData.append("email", accountForm.email);
    signupData.append("password", accountForm.password);
    signupData.append("skills", accountForm.skills);

    try {
      const signupResponse = await fetch(`${API_BASE_URL}/signup/`, {
        method: "POST",
        body: signupData,
      });
      const signupPayload = await signupResponse.json().catch(() => ({}));
      if (!signupResponse.ok) {
        setFeedback(signupPayload.email?.[0] || signupPayload.error?.[0] || "Could not create account.");
        return;
      }

      const loginData = new FormData();
      loginData.append("email", accountForm.email);
      loginData.append("password", accountForm.password);
      const loginResponse = await fetch(`${API_BASE_URL}/login/`, {
        method: "POST",
        body: loginData,
      });
      const loginPayload = await loginResponse.json().catch(() => ({}));
      if (!loginResponse.ok || !loginPayload.token) {
        setFeedback("Account created. Please sign in to finish organization setup.");
        navigate("/login");
        return;
      }

      localStorage.setItem("token", loginPayload.token);
      setFeedback("Account ready. Add your organization details.");
      setStep("organization");
    } catch {
      setFeedback("Network error. Please try again.");
    } finally {
      setSubmitting(false);
    }
  };

  const submitOrganization = async (event) => {
    event.preventDefault();
    if (submitting) return;
    setSubmitting(true);
    setFeedback("Creating your organization...");

    try {
      await organizationAPI.create(organizationForm);
      navigate("/board");
    } catch (error) {
      setFeedback(error.message || "Could not create organization.");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="login-page auth-clay-page">
      <header className="login-header clay-card">
        <button className="login-brand brand-button" onClick={() => navigate("/")} aria-label="FlowTrack home">
          <img src={logoAsset} alt="FlowTrack logo" />
          <span>FlowTrack</span>
        </button>
        <div className="login-cta">
          <button className="btn clay-button" onClick={() => navigate("/login")}>Sign in</button>
        </div>
      </header>

      <main className="login-hero auth-clay-layout">
        <section className="hero-copy clay-card auth-story-card">
          <span className="eyebrow">Organization owner onboarding</span>
          <h1>Create your workspace without platform admin access.</h1>
          <p>
            You will become the Organization Owner for this workspace. This does not grant Django
            staff or superuser permissions.
          </p>
          <div className="auth-preview-stack">
            <div className="auth-mini-card">
              <strong>1</strong>
              <span>Create account</span>
            </div>
            <div className="auth-mini-card">
              <strong>2</strong>
              <span>Add organization</span>
            </div>
            <div className="auth-mini-card">
              <strong>3</strong>
              <span>Invite members</span>
            </div>
          </div>
        </section>

        <section className="hero-preview clay-card auth-form-card">
          <div className="auth-panel-header">
            <span>{step === "account" ? "Owner account" : "Organization details"}</span>
            <strong>{step === "account" ? "Step 1 of 2" : "Step 2 of 2"}</strong>
          </div>
          {feedback && <div className="auth-feedback">{feedback}</div>}

          {step === "account" ? (
            <form className="auth-form" onSubmit={submitAccount}>
              <div className="form-row">
                <label htmlFor="owner-first-name">First name</label>
                <input id="owner-first-name" name="firstName" value={accountForm.firstName} onChange={updateAccount} required />
              </div>
              <div className="form-row">
                <label htmlFor="owner-last-name">Last name</label>
                <input id="owner-last-name" name="lastName" value={accountForm.lastName} onChange={updateAccount} />
              </div>
              <div className="form-row">
                <label htmlFor="owner-email">Email</label>
                <input id="owner-email" name="email" type="email" value={accountForm.email} onChange={updateAccount} required />
              </div>
              <div className="form-row">
                <label htmlFor="owner-password">Password</label>
                <input id="owner-password" name="password" type="password" value={accountForm.password} onChange={updateAccount} required />
              </div>
              <div className="form-row">
                <label htmlFor="owner-skills">Skills</label>
                <textarea id="owner-skills" name="skills" rows={3} value={accountForm.skills} onChange={updateAccount} />
              </div>
              <button className="btn primary clay-button" type="submit" disabled={submitting}>
                {submitting ? "Creating..." : "Continue"}
              </button>
            </form>
          ) : (
            <form className="auth-form" onSubmit={submitOrganization}>
              <div className="form-row">
                <label htmlFor="organization-name">Organization name</label>
                <input id="organization-name" name="name" value={organizationForm.name} onChange={updateOrganization} required />
              </div>
              <div className="form-row">
                <label htmlFor="organization-description">Description</label>
                <textarea id="organization-description" name="description" rows={4} value={organizationForm.description} onChange={updateOrganization} />
              </div>
              <button className="btn primary clay-button" type="submit" disabled={submitting}>
                {submitting ? "Creating..." : "Create Organization"}
              </button>
            </form>
          )}
        </section>
      </main>
    </div>
  );
}

export default CreateOrganization;

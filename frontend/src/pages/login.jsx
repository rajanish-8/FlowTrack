import "../login.css";
import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { API_BASE_URL, userAPI } from "../utils/api";
import logoAsset from "../assets/flowtrack-logo.svg";

function Login() {
  const navigate = useNavigate();
  const [form, setForm] = useState({ email: "", password: "" });
  const [feedback, setFeedback] = useState("");

  const handleChange = (e) => {
    const { name, value } = e.target;
    setForm((prev) => ({ ...prev, [name]: value }));
  };

  const submit = async (e) => {
    e.preventDefault();
    console.log("login submit", form);
    setFeedback("Signing you in...");
   

    const formData = new FormData()
    formData.append("email", form.email)
    formData.append("password", form.password)

    if (!API_BASE_URL) {
      alert("API base URL is not configured. Please set VITE_API_BASE_URL in your .env file.");
      return;
    }

    try{
      const response = await fetch(`${API_BASE_URL}/login/`,
         {
          method:'POST',
          body: formData
         })
       
      let data;
      let responseText;
      
      try {
        responseText = await response.text();
        console.log("Raw response text:", responseText);
        
        if (responseText.trim() === '') {
          console.log("Empty response body");
          setFeedback("Server returned an empty response. Please try again.");
          return;
        }
        
        // Check if response is HTML (likely an error page)
        if (responseText.trim().startsWith('<!DOCTYPE') || responseText.trim().startsWith('<html')) {
          console.error("Server returned HTML instead of JSON. This usually indicates a server error.");
          setFeedback("Server error. Please check if the backend server is running.");
          return;
        }
        
        data = JSON.parse(responseText);
        console.log("Backend response:", data);
      } catch (jsonError) {
        console.error("JSON parsing error:", jsonError);
        console.error("Response text that failed to parse:", responseText);
        
        // Check if it's an HTML response
        if (responseText && (responseText.includes('<!DOCTYPE') || responseText.includes('<html'))) {
          setFeedback("Server returned HTML instead of JSON. Please check the backend.");
        } else {
          setFeedback("Server returned an invalid response. Please try again.");
        }
        return;
      }

      if (response.ok){
        console.log("successfully logged In")
        localStorage.setItem("token",data.token)
        const roleData = await userAPI.getRoles();
        navigate(roleData.onboarding_required ? "/pending-invite" : "/board")
      }
      else{
        console.log("Error: ", data)
        if (data.error) {
          setFeedback(`Login failed: ${data.error}`);
        } else {
          setFeedback("Login failed. Please check your credentials and try again.");
        }
      }

    }
    catch(err){
      console.log("Network error:", err)
      setFeedback("Network error. Please check your connection and try again.");
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
          <button className="btn clay-button" onClick={() => navigate("/")}>Home</button>
          <button className="btn primary clay-button" onClick={() => navigate("/signup")}>Sign up</button>
        </div>
      </header>

      <main className="login-hero auth-clay-layout">
        <section className="hero-copy clay-card auth-story-card">
          <span className="eyebrow">Project delivery workspace</span>
          <h1>Welcome back to FlowTrack</h1>
          <p>Open your board, review priorities, and keep every handoff visible.</p>
          <div className="auth-preview-stack">
            <div className="auth-mini-card">
              <strong>4</strong>
              <span>Kanban lanes</span>
            </div>
            <div className="auth-mini-card">
              <strong>3</strong>
              <span>Role levels</span>
            </div>
            <div className="auth-mini-card">
              <strong>Live</strong>
              <span>Task movement</span>
            </div>
          </div>
        </section>

        <section className="hero-preview clay-card auth-form-card">
          <div className="auth-panel-header">
            <span>Secure sign in</span>
            <strong>Team board access</strong>
          </div>
          {feedback && <div className="auth-feedback">{feedback}</div>}
          <form className="auth-form" onSubmit={submit}>
            <div className="form-row">
              <label htmlFor="login-email">Email</label>
              <input
                id="login-email"
                name="email"
                type="email"
                required
                value={form.email}
                onChange={handleChange}
                placeholder="you@example.com"
              />
            </div>
            <div className="form-row">
              <label htmlFor="login-password">Password</label>
              <input
                id="login-password"
                name="password"
                type="password"
                required
                value={form.password}
                onChange={handleChange}
                placeholder="••••••••"
              />
            </div>
            <div className="form-actions">
              <button type="submit" className="btn primary">Log in</button>
              <button type="button" className="btn" onClick={() => navigate("/signup")}>Need an account? Sign up</button>
            </div>
          </form>
        </section>
      </main>
    </div>
  );
}

export default Login;

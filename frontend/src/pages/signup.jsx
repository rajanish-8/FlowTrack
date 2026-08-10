import "../login.css";
import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { API_BASE_URL } from "../utils/api";
import logoAsset from "../assets/flowtrack-logo.svg";

function Signup() {
  const navigate = useNavigate();
  const [form, setForm] = useState({
    firstName: "",
    lastName: "",
    email: "",
    password: "",
    skills: "",
  });
  const [profileFile, setProfileFile] = useState(null);
  const [profilePreviewUrl, setProfilePreviewUrl] = useState("");
  const [feedback, setFeedback] = useState("");

  const handleChange = (e) => {
    const { name, value } = e.target;
    setForm((prev) => ({ ...prev, [name]: value }));
  };

  const handleFileChange = (e) => {
    const file = e.target.files && e.target.files[0];
    setProfileFile(file || null);
    if (file) {
      const url = URL.createObjectURL(file);
      setProfilePreviewUrl(url);
    } else {
      setProfilePreviewUrl("");
    }
  };

 const submit = async (e) => {
    e.preventDefault();
   setFeedback("Creating your account...");
   const formData = new FormData() 
    //handling form data
   formData.append("first_name", form.firstName);
   formData.append("last_name", form.lastName);
   formData.append("email", form.email);
   formData.append("password", form.password);
   formData.append("skills", form.skills);

  if (profileFile) {
   formData.append("profilePicture", profileFile);
  }

    if (!API_BASE_URL) {
      setFeedback("API base URL is not configured. Please set VITE_API_BASE_URL in your .env file.");
      return;
    }

    console.log("API URL:", API_BASE_URL);

    try {
      const response = await fetch(`${API_BASE_URL}/signup/`, {
      method: "POST",
      body: formData,
     });

      console.log("Response status:", response.status);
      console.log("Response ok:", response.ok);
      console.log("Response headers:", response.headers);

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

      if(response.ok){
        setFeedback("Account created successfully. Redirecting to login...");
        navigate("/login");
      } else {
        // Handle validation errors
        if(data.email) {
          setFeedback(`Error: ${data.email[0]}`);
        } else if(data.error) {
          setFeedback(`Error: ${data.error[0]}`);
        } else {
          setFeedback("Signup failed. Please check your information and try again.");
        }
      }
} 
catch (err) {
  console.error("Network error:", err);
  setFeedback("Network error. Please try again.");
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
          <button className="btn primary clay-button" onClick={() => navigate("/login")}>Log in</button>
        </div>
      </header>

      <main className="login-hero auth-clay-layout">
        <section className="hero-copy clay-card auth-story-card">
          <span className="eyebrow">Join the workspace</span>
          <h1>Create your member account</h1>
          <p>Add your profile and skills. An Organization Owner can add your email to their workspace after signup.</p>
          <div className="auth-preview-stack">
            <div className="auth-mini-card">
              <strong>Profile</strong>
              <span>Photo and identity</span>
            </div>
            <div className="auth-mini-card">
              <strong>Skills</strong>
              <span>Team context</span>
            </div>
            <div className="auth-mini-card">
              <strong>Board</strong>
              <span>Ready after login</span>
            </div>
          </div>
        </section>

        <section className="hero-preview clay-card auth-form-card">
          <div className="auth-panel-header">
            <span>New teammate</span>
            <strong>Profile setup</strong>
          </div>
          {feedback && <div className="auth-feedback">{feedback}</div>}
          <form className="auth-form" onSubmit={submit}>
            <div className="form-row">
              <label htmlFor="first-name">First name</label>
              <input
                id="first-name"
                name="firstName"
                type="text"
                required
                value={form.firstName}
                onChange={handleChange}
                placeholder="Jane"
              />
            </div>

            <div className="form-row">
              <label htmlFor="last-name">Last name</label>
              <input
                id="last-name"
                name="lastName"
                type="text"
                required
                value={form.lastName}
                onChange={handleChange}
                placeholder="Doe"
              />
            </div>

            <div className="form-row">
              <label htmlFor="signup-email">Email</label>
              <input
                id="signup-email"
                name="email"
                type="email"
                required
                value={form.email}
                onChange={handleChange}
                placeholder="you@example.com"
              />
            </div>

            <div className="form-row">
              <label htmlFor="signup-password">Password</label>
              <input
                id="signup-password"
                name="password"
                type="password"
                required
                value={form.password}
                onChange={handleChange}
                placeholder="••••••••"
              />
            </div>

            <div className="form-row">
              <label htmlFor="skills">Skills</label>
              <textarea
                id="skills"
                name="skills"
                value={form.skills}
                onChange={handleChange}
                placeholder="tell us more about yourself"
                rows={4}
              />
            </div>

            <div className="form-row">
              <label htmlFor="profile-picture">Profile picture</label>
              <input
                id="profile-picture"
                name="profilePicture"
                type="file"
                accept="image/*"
                onChange={handleFileChange}
              />
              {profilePreviewUrl && (
                <div className="profile-preview-card">
                  <img src={profilePreviewUrl} alt="Preview" />
                  <span>Profile preview</span>
                </div>
              )}
            </div>

            <div className="form-actions">
              <button type="submit" className="btn primary">Create account</button>
              <button type="button" className="btn" onClick={() => navigate("/login")}>Have an account? Log in</button>
            </div>
          </form>
        </section>
      </main>
    </div>
  );
}

export default Signup;

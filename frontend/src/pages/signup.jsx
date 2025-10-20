import "../login.css";
import { useState } from "react";
import { useNavigate } from "react-router-dom";

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
    const payload = {
      ...form,
      profilePicture: profileFile ? profileFile.name : null,
    };
    
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

    const api = import.meta.env.VITE_API_BASE_URL
    console.log("API URL:", api) 

    try {
      const response = await fetch(`${api}/signup/`, {
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
          alert("Server returned empty response. Please try again.");
          return;
        }
        
        // Check if response is HTML (likely an error page)
        if (responseText.trim().startsWith('<!DOCTYPE') || responseText.trim().startsWith('<html')) {
          console.error("Server returned HTML instead of JSON. This usually indicates a server error.");
          alert("Server error occurred. Please check if the backend server is running and try again.");
          return;
        }
        
        data = JSON.parse(responseText);
        console.log("Backend response:", data);
      } catch (jsonError) {
        console.error("JSON parsing error:", jsonError);
        console.error("Response text that failed to parse:", responseText);
        
        // Check if it's an HTML response
        if (responseText && (responseText.includes('<!DOCTYPE') || responseText.includes('<html'))) {
          alert("Server error: Received HTML response instead of JSON. Please check if the backend server is running properly.");
        } else {
          alert("Server returned invalid response. Please try again.");
        }
        return;
      }

      if(response.ok){
        alert("Account created successfully! Redirecting to login...");
        navigate("/login");
      } else {
        // Handle validation errors
        if(data.email) {
          alert(`Error: ${data.email[0]}`);
        } else if(data.error) {
          alert(`Error: ${data.error[0]}`);
        } else {
          alert("Signup failed. Please check your information and try again.");
        }
      }
} 
catch (err) {
  console.error("Network error:", err);
  alert("Network error. Please try again.");
}


  };

  return (
    <div className="login-page">
      <header className="login-header">
        <div className="login-brand">
          <span>TaskHive</span>
        </div>
        <div className="login-cta">
          <button className="btn" onClick={() => navigate("/login")}>Log in</button>
        </div>
      </header>

      <main className="login-hero">
        <section className="hero-copy">
          <h1>Create your account</h1>
          <p>Join TaskHive to organize projects and collaborate with your team.</p>
        </section>

        <section className="hero-preview">
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
                <div className="preview-card" style={{ marginTop: "8px" }}>
                  <img src={profilePreviewUrl} alt="Preview" style={{ width: "64px", height: "64px", borderRadius: "50%" }} />
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



import "../login.css";
import { useState } from "react";
import { useNavigate } from "react-router-dom";

function Login() {
  const navigate = useNavigate();
  const [form, setForm] = useState({ email: "", password: "" });

  const handleChange = (e) => {
    const { name, value } = e.target;
    setForm((prev) => ({ ...prev, [name]: value }));
  };

  const submit = async (e) => {
    e.preventDefault();
    console.log("login submit", form);
    alert("Login submitted. Check console for data.");
   

    const formData = new FormData()
    formData.append("email", form.email)
    formData.append("password", form.password)
    
    const api = import.meta.env.VITE_API_BASE_URL

    try{
      const response = await fetch(`${api}/login/`,
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

      if (response.ok){
        console.log("successfully logged In")
        localStorage.setItem("token",data.token)
        navigate("/")
      }
      else{
        console.log("Error: ", data)
        if (data.error) {
          alert(`Login failed: ${data.error}`);
        } else {
          alert("Login failed. Please check your credentials and try again.");
        }
      }

    }
    catch(err){
      console.log("Network error:", err)
      alert("Network error. Please check your connection and try again.");
    }
  };

  return (
    <div className="login-page">
      <header className="login-header">
        <div className="login-brand">
          <span>TaskHive</span>
        </div>
        <div className="login-cta">
          <button className="btn primary" onClick={() => navigate("/signup")}>Sign up</button>
        </div>
      </header>

      <main className="login-hero">
        <section className="hero-copy">
          <h1>Welcome back</h1>
          <p>Log in to access your boards and keep work moving.</p>
        </section>

        <section className="hero-preview">
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



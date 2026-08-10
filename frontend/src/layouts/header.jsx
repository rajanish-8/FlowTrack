import logoAsset from "../assets/flowtrack-logo.svg";
import defaultAvatar from "../assets/default-avatar.svg";

function Header({ userData, userRole }){
 const logo_path = logoAsset;
 const roleLabel = {
   owner: "Organization Owner",
   manager: "Manager",
   member: "Member",
 }[userRole] || "Workspace";
 
 // Handle logout functionality
 const handleLogout = () => {
   localStorage.removeItem("token");
   window.location.href = "/login";
 };

 return(
    <header>
        <div className="Logo">
            <img src={logo_path} alt="FlowTrack logo" />
            <h1>FlowTrack</h1>
        </div>

        {/* Navigation - hidden on mobile, shown in responsive design */}
        <nav>
            <ul>
                <li>Dashboard</li>
                <li>Projects</li>
                <li>Tasks</li>
            </ul>
        </nav>

        {/* User Profile Section */}
        <div className="user-profile">
            {userData ? (
                <div className="user-info">
                    <span className="role-badge">{roleLabel}</span>
                    <img 
                        src={userData.profile_picture || defaultAvatar} 
                        alt="User profile" 
                        className="user-avatar"
                    />
                    <span className="username">{userData.username}</span>
                    <button 
                        onClick={handleLogout}
                        className="logout-btn"
                        title="Logout"
                    >
                        Logout
                    </button>
                </div>
            ) : (
                <div className="user-info">
                    <span className="role-badge">{roleLabel}</span>
                    <img 
                        src={defaultAvatar} 
                        alt="Default profile" 
                        className="user-avatar"
                    />
                    <span className="username">Loading...</span>
                </div>
            )}
        </div>
    </header>
 )
}

export default Header

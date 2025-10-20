import logoAsset from "../assets/flowtrack-logo.svg";
import defaultAvatar from "../assets/default-avatar.svg";
import { useState } from "react";

function Header({ userData }){
 const logo_path = logoAsset;
 const [showUserMenu, setShowUserMenu] = useState(false);
 
 // Handle logout functionality
 const handleLogout = () => {
   localStorage.removeItem("token");
   window.location.href = "/login";
 };

 // Toggle user menu on mobile
 const toggleUserMenu = () => {
   setShowUserMenu(!showUserMenu);
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
                    <img 
                        src={userData.profile_picture || defaultAvatar} 
                        alt="User profile" 
                        className="user-avatar"
                        onClick={toggleUserMenu}
                        style={{ cursor: 'pointer' }}
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
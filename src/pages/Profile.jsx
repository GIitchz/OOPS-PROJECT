// src/pages/Profile.jsx
import  Supabase from '../utils/Database';
import { useNavigate } from "react-router-dom";
import { useEffect, useState, useContext } from "react";
import { AuthContext } from '../context/AuthContext';
import './Profile.css'; // optional styling file

function ProfilePage() {
  const navigate = useNavigate();
  const { user, loading, setUser, setSession} = useContext(AuthContext);

  const handleLogout = async () => {
    await Supabase.auth.signOut();
    setUser(null);
    setSession(null);
    navigate("/");
  };

  return (
    <div className="profile-container">
      {/* LEFT SIDEBAR */}
      <aside className="profile-sidebar">
        <h2 className="sidebar-title">Your Profile</h2>
        <ul className="sidebar-links">
          <li><button onClick={() => navigate('/cart')}>Cart</button></li>
          <li><button onClick={handleLogout}>Log Out</button></li>
        </ul>
      </aside>

      {/* MAIN CONTENT */}
      <main className="profile-main">
        {user && !loading ? (
          <>
            <p>Welcome, <strong>{user.name || user.email}</strong>!</p>
          </>
        ) : (
          <p>Loading user data...</p>
        )}
      </main>
    </div>
  );
}

export default ProfilePage;

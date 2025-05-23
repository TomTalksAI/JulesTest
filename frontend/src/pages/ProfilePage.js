import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '../services/supabaseClient';

function ProfilePage() {
  const [user, setUser] = useState(null);
  const navigate = useNavigate();

  useEffect(() => {
    const session = supabase.auth.session();
    if (session) {
      setUser(session.user);
    } else {
      navigate('/auth');
    }
  }, [navigate]);

  const handleLogout = async () => {
    await supabase.auth.signOut();
    navigate('/');
  };

  if (!user) return <p>Loading user profile...</p>;

  return (
    <div>
      <h2>User Profile</h2>
      <p><strong>Email:</strong> {user.email}</p>
      {/* Add more user details here if needed */}
      <button onClick={handleLogout}>Logout</button>
    </div>
  );
}
export default ProfilePage;

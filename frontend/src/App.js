import React, { useState, useEffect } from 'react';
import { BrowserRouter as Router, Routes, Route, Link, Navigate } from 'react-router-dom';
import HomePage from './pages/HomePage';
import AuthPage from './pages/AuthPage';
import ProfilePage from './pages/ProfilePage';
import SubmitPromptPage from './pages/SubmitPromptPage';
import PromptDetailPage from './pages/PromptDetailPage';
import LeaderboardPage from './pages/LeaderboardPage'; // New Import
import { supabase } from './services/supabaseClient';
import './App.css';

function App() {
  const [session, setSession] = useState(supabase.auth.session());

  useEffect(() => {
    supabase.auth.onAuthStateChange((_event, session) => {
      setSession(session);
    });
  }, []);

  return (
    <Router>
      <div className="App">
        <nav>
          <ul>
            <li><Link to="/">Home</Link></li>
            <li><Link to="/leaderboard">Leaderboard</Link></li> {/* New Link */}
            {!session && <li><Link to="/auth">Login/Sign Up</Link></li>}
            {session && (
              <>
                <li><Link to="/profile">Profile</Link></li>
                <li><Link to="/submit-prompt">Submit Prompt</Link></li>
              </>
            )}
          </ul>
        </nav>
        <hr />
        <Routes>
          <Route path="/" element={<HomePage />} />
          <Route path="/auth" element={!session ? <AuthPage /> : <Navigate to="/" />} />
          <Route path="/profile" element={session ? <ProfilePage /> : <Navigate to="/auth" />} />
          <Route path="/submit-prompt" element={session ? <SubmitPromptPage /> : <Navigate to="/auth?redirect=/submit-prompt" />} />
          <Route path="/prompts/:promptId" element={<PromptDetailPage />} />
          <Route path="/leaderboard" element={<LeaderboardPage />} /> {/* New Route */}
          {/* Add other routes here later */}
        </Routes>
      </div>
    </Router>
  );
}
export default App;

import React, { useState, useEffect } from 'react';
import { supabase } from '../services/supabaseClient';
import { Link } from 'react-router-dom';

function LeaderboardPage() {
  const [contributionLeaders, setContributionLeaders] = useState([]);
  const [upvoteLeaders, setUpvoteLeaders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchLeaderboardData = async () => {
      setLoading(true);
      setError(null);
      try {
        // 1. Leaderboard for Most Contributions
        //    This query groups prompts by user_id and counts them.
        //    Ideally, we'd join with a 'profiles' table to get usernames.
        const { data: contribData, error: contribError } = await supabase
          .from('prompts')
          .select('user_id, count:id.count') // Aggregating count of prompts
          .group('user_id')
          .order('count', { ascending: false })
          .limit(10); // Top 10 contributors

        if (contribError) throw contribError;
        setContributionLeaders(contribData || []);

        // 2. Leaderboard for Highest Total Upvotes
        //    This query sums upvotes for all prompts grouped by user_id.
        //    This is a simplified client-side approach.
        //    A Supabase function (RPC) would be more efficient for this.
        const { data: promptsData, error: promptsError } = await supabase
          .from('prompts')
          .select('user_id, upvotes'); // Select user_id and their prompts' upvotes

        if (promptsError) throw promptsError;

        if (promptsData) {
          const userUpvotes = promptsData.reduce((acc, prompt) => {
            acc[prompt.user_id] = (acc[prompt.user_id] || 0) + (prompt.upvotes || 0);
            return acc;
          }, {});

          const sortedUpvoteLeaders = Object.entries(userUpvotes)
            .map(([userId, totalUpvotes]) => ({ user_id: userId, total_upvotes: totalUpvotes }))
            .sort((a, b) => b.total_upvotes - a.total_upvotes)
            .slice(0, 10); // Top 10 by upvotes
          setUpvoteLeaders(sortedUpvoteLeaders);
        }

      } catch (err) {
        console.error("Error fetching leaderboard data:", err);
        setError(err.message);
      } finally {
        setLoading(false);
      }
    };

    fetchLeaderboardData();
  }, []);

  if (loading) return <p>Loading leaderboards...</p>;
  if (error) return <p style={{ color: 'red' }}>Error loading leaderboards: {error}</p>;

  return (
    <div>
      <h2>Leaderboards</h2>

      <section style={{ marginBottom: '30px' }}>
        <h3>Top Contributors (Most Prompts)</h3>
        {contributionLeaders.length > 0 ? (
          <ol>
            {contributionLeaders.map(leader => (
              <li key={leader.user_id}>
                User ID: {leader.user_id ? leader.user_id.substring(0,8) : 'N/A'}... - {leader.count} prompts
                {/* Ideally, Link to user profile if it exists: <Link to={`/users/${leader.user_id}`}>View Profile</Link> */}
              </li>
            ))}
          </ol>
        ) : (
          <p>No contribution data available yet.</p>
        )}
      </section>

      <section>
        <h3>Top Rated Users (Most Upvotes on Prompts)</h3>
        {upvoteLeaders.length > 0 ? (
          <ol>
            {upvoteLeaders.map(leader => (
              <li key={leader.user_id}>
                User ID: {leader.user_id ? leader.user_id.substring(0,8) : 'N/A'}... - {leader.total_upvotes} total upvotes
              </li>
            ))}
          </ol>
        ) : (
          <p>No upvote data available yet.</p>
        )}
      </section>
      <br />
      <Link to="/">Back to Home</Link>
    </div>
  );
}

export default LeaderboardPage;

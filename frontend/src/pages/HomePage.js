import React, { useState, useEffect, useMemo } from 'react';
import { Link } from 'react-router-dom';
import { supabase } from '../services/supabaseClient';
import PromptCard from '../components/prompts/PromptCard';
import { predefinedCategories } from '../services/data';

function HomePage() {
  const session = supabase.auth.session();
  const [prompts, setPrompts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [selectedCategory, setSelectedCategory] = useState('');
  const [searchTerm, setSearchTerm] = useState('');

  useEffect(() => {
    const fetchPrompts = async () => {
      setLoading(true);
      setError(null);
      try {
        // TODO: Later, fetch user details to show username instead of user_id
        const { data, error: dbError } = await supabase
          .from('prompts')
          .select('*') // Select all columns
          .order('created_at', { ascending: false }); // Order by newest first

        if (dbError) throw dbError;
        setPrompts(data || []);
      } catch (err) {
        setError(err.message);
        console.error("Error fetching prompts:", err);
      } finally {
        setLoading(false);
      }
    };
    fetchPrompts();
  }, []);

  const filteredPrompts = useMemo(() => {
    return prompts
      .filter(prompt => {
        // Category filter
        if (selectedCategory && prompt.category_id !== parseInt(selectedCategory)) {
          return false;
        }
        // Search term filter (searches in title and prompt_text)
        if (searchTerm) {
          const lowerSearchTerm = searchTerm.toLowerCase();
          const titleMatch = prompt.title?.toLowerCase().includes(lowerSearchTerm);
          const textMatch = prompt.prompt_text?.toLowerCase().includes(lowerSearchTerm);
          if (!titleMatch && !textMatch) {
            return false;
          }
        }
        return true;
      });
  }, [prompts, selectedCategory, searchTerm]);

  return (
    <div>
      <h1>Welcome to World of PromptCraft</h1>
      {session ? (
        <p>You are logged in. <Link to="/profile">View Profile</Link> | <Link to="/submit-prompt">Submit a Prompt</Link></p>
      ) : (
        <p><Link to="/auth">Login or Sign Up</Link> to submit and vote on prompts!</p>
      )}

      <h2>Discover Prompts</h2>

      {/* Filters and Search */}
      <div style={{ margin: '20px 0' }}>
        <label htmlFor="category-filter">Filter by Category: </label>
        <select
          id="category-filter"
          value={selectedCategory}
          onChange={(e) => setSelectedCategory(e.target.value)}
        >
          <option value="">All Categories</option>
          {predefinedCategories.map(cat => (
            <option key={cat.id} value={cat.id}>{cat.name}</option>
          ))}
        </select>

        <label htmlFor="search-term" style={{ marginLeft: '20px' }}>Search: </label>
        <input
          type="text"
          id="search-term"
          placeholder="Search prompts..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
        />
      </div>

      {loading && <p>Loading prompts...</p>}
      {error && <p style={{ color: 'red' }}>Error loading prompts: {error}</p>}

      {!loading && !error && filteredPrompts.length === 0 && (
        <p>No prompts found. {prompts.length > 0 ? 'Try adjusting your filters.' : 'Be the first to submit one!'}</p>
      )}

      {!loading && !error && filteredPrompts.length > 0 && (
        <div className="prompt-list">
          {filteredPrompts.map(prompt => (
            <PromptCard key={prompt.id} prompt={prompt} />
          ))}
        </div>
      )}
    </div>
  );
}
export default HomePage;

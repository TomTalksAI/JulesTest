import React, { useState } from 'react';
import { supabase } from '../../services/supabaseClient';
import { predefinedCategories } from '../../services/data'; // Using predefined categories

function PromptForm({ onSuccess }) {
  const [title, setTitle] = useState('');
  const [promptText, setPromptText] = useState('');
  const [categoryId, setCategoryId] = useState(predefinedCategories[0]?.id || ''); // Default to first category
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState('');

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setMessage('');

    const user = supabase.auth.user();
    if (!user) {
      setMessage('Error: You must be logged in to submit a prompt.');
      setLoading(false);
      return;
    }

    try {
      const { data, error } = await supabase
        .from('prompts')
        .insert([
          {
            title,
            prompt_text: promptText,
            category_id: categoryId ? parseInt(categoryId) : null,
            user_id: user.id,
            // upvotes and downvotes default to 0 in the database schema
          },
        ]);

      if (error) throw error;

      setMessage('Prompt submitted successfully!');
      setTitle('');
      setPromptText('');
      setCategoryId(predefinedCategories[0]?.id || '');
      if (onSuccess) onSuccess(data[0]);

    } catch (error) {
      setMessage(`Error submitting prompt: ${error.message}`);
    } finally {
      setLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit}>
      {message && <p>{message}</p>}
      <div>
        <label htmlFor="title">Title:</label>
        <input
          type="text"
          id="title"
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          required
        />
      </div>
      <div>
        <label htmlFor="promptText">Prompt Text:</label>
        <textarea
          id="promptText"
          value={promptText}
          onChange={(e) => setPromptText(e.target.value)}
          rows="5"
          required
        />
      </div>
      <div>
        <label htmlFor="category">Category:</label>
        <select
          id="category"
          value={categoryId}
          onChange={(e) => setCategoryId(e.target.value)}
        >
          <option value="">Select a category (optional)</option>
          {predefinedCategories.map(cat => (
            <option key={cat.id} value={cat.id}>{cat.name}</option>
          ))}
        </select>
      </div>
      <button type="submit" disabled={loading}>
        {loading ? 'Submitting...' : 'Submit Prompt'}
      </button>
    </form>
  );
}

export default PromptForm;

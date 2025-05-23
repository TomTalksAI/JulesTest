import React, { useState } from 'react';
import { supabase } from '../../services/supabaseClient';

function CommentForm({ promptId, onCommentAdded }) {
  const [content, setContent] = useState('');
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState('');
  const session = supabase.auth.session();

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!session?.user) {
      setMessage('You must be logged in to comment.');
      return;
    }
    if (!content.trim()) {
      setMessage('Comment cannot be empty.');
      return;
    }
    setLoading(true);
    setMessage('');

    try {
      const { data, error } = await supabase
        .from('comments')
        .insert({
          prompt_id: promptId,
          user_id: session.user.id,
          content: content.trim(),
          // parent_comment_id: null, // For direct comments, implement threading later if needed
        })
        .select() // to get the inserted comment back with all fields, including created_at
        .single(); 

      if (error) throw error;

      setContent('');
      if (onCommentAdded) onCommentAdded(data); // Pass new comment to parent
      setMessage('Comment posted successfully!');
      setTimeout(() => setMessage(''), 3000); // Clear message after 3s
    } catch (error) {
      setMessage(`Error posting comment: ${error.message}`);
      console.error('Error posting comment:', error);
    } finally {
      setLoading(false);
    }
  };

  if (!session?.user) {
    return <p><a href="/auth">Login</a> to post a comment.</p>;
  }

  return (
    <form onSubmit={handleSubmit} style={{ marginTop: '20px' }}>
      <h4>Leave a Comment</h4>
      {message && <p>{message}</p>}
      <div>
        <textarea
          value={content}
          onChange={(e) => setContent(e.target.value)}
          rows="3"
          placeholder="Write your comment..."
          required
          style={{ width: '100%', padding: '8px' }}
        />
      </div>
      <button type="submit" disabled={loading} style={{ marginTop: '5px' }}>
        {loading ? 'Posting...' : 'Post Comment'}
      </button>
    </form>
  );
}

export default CommentForm;

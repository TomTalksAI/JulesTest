import React from 'react';

// Basic component, can be enhanced later with user profiles, timestamps etc.
// For now, assumes comments are fetched with user_id and content.
function CommentList({ comments }) {
  if (!comments || comments.length === 0) {
    return <p>No comments yet. Be the first to comment!</p>;
  }

  return (
    <div style={{ marginTop: '20px' }}>
      <h4>Comments</h4>
      {comments.map(comment => (
        <div key={comment.id} style={{ border: '1px solid #eee', padding: '10px', marginBottom: '10px' }}>
          <p><strong>User ID:</strong> {comment.user_id ? comment.user_id.substring(0,8) + '...' : 'Anonymous'}</p> {/* Placeholder for username */}
          <p>{comment.content}</p>
          <small>Posted on: {new Date(comment.created_at).toLocaleString()}</small>
          {/* Add replies or edit/delete options later */}
        </div>
      ))}
    </div>
  );
}

export default CommentList;

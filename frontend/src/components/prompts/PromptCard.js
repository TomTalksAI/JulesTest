import React from 'react';
import { Link } from 'react-router-dom'; // Assuming we'll have a detail page later

// Function to get category name from ID (can be moved to a service later)
import { predefinedCategories } from '../../services/data';
const getCategoryName = (categoryId) => {
  const category = predefinedCategories.find(cat => cat.id === categoryId);
  return category ? category.name : 'Uncategorized';
};

function PromptCard({ prompt }) {
  if (!prompt) return null;

  return (
    <div style={{ border: '1px solid #ccc', margin: '10px', padding: '10px' }}>
      <h3><Link to={`/prompts/${prompt.id}`}>{prompt.title}</Link></h3> {/* Modified Title to be a Link */}
      <p><strong>Category:</strong> {getCategoryName(prompt.category_id)}</p>
      <p><strong>Author:</strong> {prompt.user_id ? prompt.user_id.substring(0, 8) + '...' : 'Unknown'}</p> {/* Placeholder for author username later */}
      <p><strong>Votes:</strong> {prompt.upvotes || 0} Up / {prompt.downvotes || 0} Down</p>
      <p>{prompt.prompt_text ? prompt.prompt_text.substring(0, 100) + '...' : ''}</p>
      <Link to={`/prompts/${prompt.id}`}>View Details</Link> {/* Ensure this link is present */}
    </div>
  );
}

export default PromptCard;

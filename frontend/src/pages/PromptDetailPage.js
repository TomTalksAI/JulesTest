import React, { useState, useEffect } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { supabase } from '../services/supabaseClient';
import { predefinedCategories } from '../services/data';
import CommentList from '../../components/comments/CommentList'; // Added import
import CommentForm from '../../components/comments/CommentForm'; // Added import

const getCategoryName = (categoryId) => {
  const category = predefinedCategories.find(cat => cat.id === categoryId);
  return category ? category.name : 'Uncategorized';
};

function PromptDetailPage() {
  const { promptId } = useParams();
  const [prompt, setPrompt] = useState(null);
  const [loading, setLoading] = useState(true); // For main prompt data
  const [error, setError] = useState(null);
  const [userVote, setUserVote] = useState(null);
  const [voteLoading, setVoteLoading] = useState(false);
  const [comments, setComments] = useState([]);
  const [commentsLoading, setCommentsLoading] = useState(false); // Separate loading for comments
  const navigate = useNavigate();
  const session = supabase.auth.session();

  useEffect(() => {
    const fetchPromptData = async () => {
      if (!promptId) return;
      setLoading(true);
      setCommentsLoading(true); // Start loading comments as well
      setError(null);
      try {
        // Fetch prompt details
        const { data: promptData, error: promptError } = await supabase
          .from('prompts')
          .select('*')
          .eq('id', promptId)
          .single();
        if (promptError) throw promptError;
        if (!promptData) throw new Error('Prompt not found.');
        setPrompt(promptData);

        // Fetch user's current vote
        if (session?.user) {
          const { data: voteData, error: voteError } = await supabase
            .from('votes')
            .select('vote_type')
            .eq('prompt_id', promptId)
            .eq('user_id', session.user.id)
            .single();
          if (voteError && voteError.code !== 'PGRST116') {
            console.error("Error fetching user vote:", voteError);
          }
          if (voteData) {
            setUserVote(voteData.vote_type === 1 ? 'up' : 'down');
          } else {
            setUserVote(null);
          }
        }

        // Fetch comments for this prompt
        // TODO: Later, join with a profiles table to get usernames
        const { data: commentsData, error: commentsError } = await supabase
          .from('comments')
          .select('*') // Select all comment fields
          .eq('prompt_id', promptId)
          .order('created_at', { ascending: true }); // Show oldest comments first
        if (commentsError) throw commentsError; // Rethrow to be caught by main catch
        setComments(commentsData || []);

      } catch (err) {
        setError(err.message);
        console.error("Error fetching prompt data or comments:", err);
      } finally {
        setLoading(false);
        setCommentsLoading(false); // Stop loading comments
      }
    };
    fetchPromptData();
  }, [promptId, session?.user?.id]); // Re-fetch if user logs in/out for vote status

  const handleVote = async (newVoteType) => {
    if (!session?.user) {
      alert('You must be logged in to vote.');
      navigate('/auth?redirect=/prompts/' + promptId);
      return;
    }
    if (voteLoading) return;
    setVoteLoading(true);

    let currentPrompt = prompt;
    let newUpvotes = currentPrompt.upvotes;
    let newDownvotes = currentPrompt.downvotes;
    const oldVoteTypeNumeric = userVote === 'up' ? 1 : (userVote === 'down' ? -1 : 0);
    const newVoteTypeNumeric = newVoteType === 'up' ? 1 : -1;
    const previousUserVote = userVote;
    let optimisticUserVote = null;

    try {
      if (userVote !== newVoteType) {
        optimisticUserVote = newVoteType;
        const { error: voteError } = await supabase
          .from('votes')
          .upsert({
            prompt_id: promptId,
            user_id: session.user.id,
            vote_type: newVoteTypeNumeric,
          }, { onConflict: 'user_id, prompt_id' });
        if (voteError) throw voteError;

        if (oldVoteTypeNumeric === 1) newUpvotes--;
        if (oldVoteTypeNumeric === -1) newDownvotes--;
        if (newVoteTypeNumeric === 1) newUpvotes++;
        if (newVoteTypeNumeric === -1) newDownvotes++;
      } else if (userVote === newVoteType) {
        optimisticUserVote = null;
        const { error: deleteVoteError } = await supabase
          .from('votes')
          .delete()
          .eq('prompt_id', promptId)
          .eq('user_id', session.user.id)
          .eq('vote_type', newVoteTypeNumeric);
        if (deleteVoteError) throw deleteVoteError;

        if (newVoteTypeNumeric === 1) newUpvotes--;
        if (newVoteTypeNumeric === -1) newDownvotes--;
      }
      
      setUserVote(optimisticUserVote);

      const { data: updatedPromptData, error: updatePromptError } = await supabase
        .from('prompts')
        .update({ upvotes: newUpvotes, downvotes: newDownvotes })
        .eq('id', promptId)
        .select()
        .single();
      if (updatePromptError) throw updatePromptError;
      setPrompt(updatedPromptData);

    } catch (error) {
      console.error('Error handling vote:', error);
      alert(`Error processing vote: ${error.message}`);
      setUserVote(previousUserVote);
    } finally {
      setVoteLoading(false);
    }
  };

  const handleNewComment = (newComment) => {
    // Add comment to the list optimistically
    setComments(prevComments => [...prevComments, newComment]);
  };

  if (loading) return <p>Loading prompt details...</p>;
  if (error && !prompt) return <p style={{ color: 'red' }}>Error: {error} <Link to="/">Go Home</Link></p>; // Show main error if prompt fails to load
  if (!prompt) return <p>Prompt not found. <Link to="/">Go Home</Link></p>;

  return (
    <div>
      <h2>{prompt.title}</h2>
      <p><strong>Category:</strong> {getCategoryName(prompt.category_id)}</p>
      <p><strong>Author ID:</strong> {prompt.user_id ? prompt.user_id.substring(0,8) + '...' : 'Unknown'}</p>
      <p><strong>Created:</strong> {new Date(prompt.created_at).toLocaleString()}</p>
      
      <p>
        <strong>Votes:</strong> {prompt.upvotes || 0} Up / {prompt.downvotes || 0} Down
      </p>
      {session?.user && (
        <div style={{ margin: '10px 0' }}>
          <button 
            onClick={() => handleVote('up')} 
            disabled={voteLoading} 
            style={{ backgroundColor: userVote === 'up' ? 'lightgreen' : 'initial', marginRight: '5px' }}
          >
            Upvote ({prompt.upvotes || 0})
          </button>
          <button 
            onClick={() => handleVote('down')} 
            disabled={voteLoading} 
            style={{ backgroundColor: userVote === 'down' ? 'lightcoral' : 'initial', marginLeft: '5px' }}
          >
            Downvote ({prompt.downvotes || 0})
          </button>
        </div>
      )}
      {!session?.user && (
        <p><Link to={`/auth?redirect=/prompts/${promptId}`}>Login</Link> to vote.</p>
      )}

      <hr />
      <h3>Prompt Text:</h3>
      <pre style={{ whiteSpace: 'pre-wrap', background: '#f4f4f4', padding: '10px', borderRadius: '4px' }}>
        {prompt.prompt_text}
      </pre>
      <hr />
      <div>
        <h4>Try it (Placeholder)</h4>
        <p>An interface to try this prompt might appear here.</p>
      </div>
      <hr />
      {/* Integrated Comments Section */}
      <div>
        {commentsLoading ? <p>Loading comments...</p> : <CommentList comments={comments} />}
        {error && !commentsLoading && <p style={{color: 'red'}}>Error loading comments: {error}</p>} {/* Show specific error for comments if prompt loaded but comments failed */}
        <CommentForm promptId={prompt.id} onCommentAdded={handleNewComment} />
      </div>
      <br />
      <Link to="/">Back to Home</Link>
    </div>
  );
}

export default PromptDetailPage;

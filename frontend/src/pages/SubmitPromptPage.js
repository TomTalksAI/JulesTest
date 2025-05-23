import React from 'react';
import { useNavigate } from 'react-router-dom';
import PromptForm from '../components/prompts/PromptForm';
import { supabase } from '../services/supabaseClient';

function SubmitPromptPage() {
  const navigate = useNavigate();
  const session = supabase.auth.session();

  if (!session) {
       // Or show a message, or use a ProtectedRoute
      navigate('/auth?redirect=/submit-prompt');
      return <p>Please login to submit a prompt.</p>;
  }


  const handleSuccess = (newPrompt) => {
    // Optionally navigate to the new prompt's page or a success page
    // For now, we can just stay here or navigate to home
    console.log('Prompt submitted:', newPrompt);
    // navigate(`/prompt/${newPrompt.id}`); // If prompt detail page exists
    navigate('/');
  };

  return (
    <div>
      <h2>Submit a New Prompt</h2>
      <PromptForm onSuccess={handleSuccess} />
    </div>
  );
}

export default SubmitPromptPage;

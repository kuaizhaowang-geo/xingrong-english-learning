import { useNavigate } from 'react-router-dom';
import { useCallback } from 'react';

const FALLBACK_PATH = '/textbook-sync';

export function usePracticeBack(): () => void {
  const navigate = useNavigate();

  const handleBack = useCallback(() => {
    try {
      if (window.history.length > 1) {
        navigate(-1);
      } else {
        navigate(FALLBACK_PATH);
      }
    } catch {
      navigate(FALLBACK_PATH);
    }
  }, [navigate]);

  return handleBack;
}

export default usePracticeBack;

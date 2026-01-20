import { useQuery } from '@tanstack/react-query';
import { fetchSubjects, ApiSubject } from '@/services/api';
import { useAuth } from '@/contexts/AuthContext';

export const useSubjects = () => {
  const { isAuthenticated } = useAuth();
  
  return useQuery<ApiSubject[]>({
    queryKey: ['subjects', isAuthenticated],
    queryFn: fetchSubjects,
    staleTime: 5 * 60 * 1000, // 5 minutes
    enabled: isAuthenticated, // Only fetch when authenticated
    retry: false, // Don't retry on auth errors
  });
};

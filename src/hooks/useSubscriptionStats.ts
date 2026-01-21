import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';

interface SubscriptionStats {
  total: number;
  last24h: number;
  last7d: number;
  last30d: number;
  byBrowser: { browser: string; count: number }[];
}

const parseBrowser = (userAgent: string | null): string => {
  if (!userAgent) return 'Unknown';
  
  if (userAgent.includes('Firefox')) return 'Firefox';
  if (userAgent.includes('Edg')) return 'Edge';
  if (userAgent.includes('Chrome')) return 'Chrome';
  if (userAgent.includes('Safari')) return 'Safari';
  if (userAgent.includes('Opera') || userAgent.includes('OPR')) return 'Opera';
  
  return 'Other';
};

export const useSubscriptionStats = () => {
  return useQuery({
    queryKey: ['subscription-stats'],
    queryFn: async (): Promise<SubscriptionStats> => {
      // Fetch all subscriptions - use service role via edge function
      const { data, error } = await supabase.functions.invoke('get-subscription-stats');
      
      if (error) throw error;
      
      return data as SubscriptionStats;
    },
    refetchInterval: 30000, // Refresh every 30 seconds
  });
};

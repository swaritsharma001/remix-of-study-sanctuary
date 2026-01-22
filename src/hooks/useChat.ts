import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';

export interface ChatMessage {
  id: string;
  created_at: string;
  user_token: string;
  user_name: string;
  message: string;
}

export const useChat = () => {
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const { token } = useAuth();

  // Get user name from cookie
  const getUserName = useCallback((): string => {
    const cookies = document.cookie.split(';');
    for (const cookie of cookies) {
      const [cookieName, cookieValue] = cookie.trim().split('=');
      if (cookieName === 'user_name') {
        return decodeURIComponent(cookieValue);
      }
    }
    return 'Anonymous';
  }, []);

  // Fetch initial messages
  const fetchMessages = useCallback(async () => {
    try {
      const { data, error } = await supabase
        .from('chat_messages' as any)
        .select('*')
        .order('created_at', { ascending: true })
        .limit(100);

      if (error) throw error;
      setMessages((data as unknown as ChatMessage[]) || []);
    } catch (error) {
      console.error('Error fetching messages:', error);
    } finally {
      setIsLoading(false);
    }
  }, []);

  // Send a message
  const sendMessage = useCallback(async (messageText: string) => {
    if (!token || !messageText.trim()) return false;

    const userName = getUserName();
    
    try {
      const { error } = await supabase
        .from('chat_messages' as any)
        .insert({
          user_token: token,
          user_name: userName,
          message: messageText.trim(),
        } as any);

      if (error) throw error;
      return true;
    } catch (error) {
      console.error('Error sending message:', error);
      return false;
    }
  }, [token, getUserName]);

  // Set up realtime subscription
  useEffect(() => {
    fetchMessages();

    const channel = supabase
      .channel('chat_messages_realtime')
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'chat_messages',
        },
        (payload) => {
          const newMessage = payload.new as ChatMessage;
          setMessages((prev) => [...prev, newMessage]);
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [fetchMessages]);

  return {
    messages,
    isLoading,
    sendMessage,
    currentUserToken: token,
  };
};

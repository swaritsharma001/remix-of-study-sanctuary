import { useState, useEffect, useCallback, useRef } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';

export interface ChatReaction {
  id: string;
  message_id: string;
  user_token: string;
  user_name: string;
  emoji: string;
}

export interface ChatMessage {
  id: string;
  created_at: string;
  user_token: string;
  user_name: string;
  message: string;
  reactions?: ChatReaction[];
}

export interface TypingUser {
  user_token: string;
  user_name: string;
}

export const useChat = () => {
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [reactions, setReactions] = useState<ChatReaction[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [typingUsers, setTypingUsers] = useState<TypingUser[]>([]);
  const { token } = useAuth();
  const typingChannelRef = useRef<any>(null);
  const typingTimeoutRef = useRef<NodeJS.Timeout | null>(null);

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

  // Fetch reactions
  const fetchReactions = useCallback(async () => {
    try {
      const { data, error } = await supabase
        .from('chat_reactions' as any)
        .select('*');

      if (error) throw error;
      setReactions((data as unknown as ChatReaction[]) || []);
    } catch (error) {
      console.error('Error fetching reactions:', error);
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
      
      // Stop typing indicator when message is sent
      stopTyping();
      return true;
    } catch (error) {
      console.error('Error sending message:', error);
      return false;
    }
  }, [token, getUserName]);

  // Add reaction to message
  const addReaction = useCallback(async (messageId: string, emoji: string) => {
    if (!token) return false;

    const userName = getUserName();
    
    try {
      // Check if user already reacted with this emoji
      const existingReaction = reactions.find(
        r => r.message_id === messageId && r.user_token === token && r.emoji === emoji
      );

      if (existingReaction) {
        // Remove reaction
        const { error } = await supabase
          .from('chat_reactions' as any)
          .delete()
          .eq('id', existingReaction.id);
        
        if (error) throw error;
      } else {
        // Add reaction
        const { error } = await supabase
          .from('chat_reactions' as any)
          .insert({
            message_id: messageId,
            user_token: token,
            user_name: userName,
            emoji: emoji,
          } as any);

        if (error) throw error;
      }
      return true;
    } catch (error) {
      console.error('Error toggling reaction:', error);
      return false;
    }
  }, [token, getUserName, reactions]);

  // Start typing indicator
  const startTyping = useCallback(() => {
    if (!token || !typingChannelRef.current) return;

    const userName = getUserName();
    
    typingChannelRef.current.track({
      user_token: token,
      user_name: userName,
      typing: true,
    });

    // Clear existing timeout
    if (typingTimeoutRef.current) {
      clearTimeout(typingTimeoutRef.current);
    }

    // Auto-stop typing after 3 seconds
    typingTimeoutRef.current = setTimeout(() => {
      stopTyping();
    }, 3000);
  }, [token, getUserName]);

  // Stop typing indicator
  const stopTyping = useCallback(() => {
    if (typingChannelRef.current) {
      typingChannelRef.current.untrack();
    }
    if (typingTimeoutRef.current) {
      clearTimeout(typingTimeoutRef.current);
      typingTimeoutRef.current = null;
    }
  }, []);

  // Set up realtime subscriptions
  useEffect(() => {
    fetchMessages();
    fetchReactions();

    // Messages channel
    const messagesChannel = supabase
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

    // Reactions channel
    const reactionsChannel = supabase
      .channel('chat_reactions_realtime')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'chat_reactions',
        },
        (payload) => {
          if (payload.eventType === 'INSERT') {
            setReactions((prev) => [...prev, payload.new as ChatReaction]);
          } else if (payload.eventType === 'DELETE') {
            setReactions((prev) => prev.filter(r => r.id !== (payload.old as any).id));
          }
        }
      )
      .subscribe();

    // Typing presence channel
    const typingChannel = supabase.channel('typing_indicators');
    typingChannelRef.current = typingChannel;

    typingChannel
      .on('presence', { event: 'sync' }, () => {
        const state = typingChannel.presenceState();
        const users: TypingUser[] = [];
        
        Object.values(state).forEach((presences: any) => {
          presences.forEach((presence: any) => {
            if (presence.typing && presence.user_token !== token) {
              users.push({
                user_token: presence.user_token,
                user_name: presence.user_name,
              });
            }
          });
        });
        
        setTypingUsers(users);
      })
      .subscribe();

    return () => {
      supabase.removeChannel(messagesChannel);
      supabase.removeChannel(reactionsChannel);
      supabase.removeChannel(typingChannel);
      if (typingTimeoutRef.current) {
        clearTimeout(typingTimeoutRef.current);
      }
    };
  }, [fetchMessages, fetchReactions, token]);

  // Get reactions for a specific message
  const getMessageReactions = useCallback((messageId: string) => {
    return reactions.filter(r => r.message_id === messageId);
  }, [reactions]);

  return {
    messages,
    isLoading,
    sendMessage,
    addReaction,
    getMessageReactions,
    typingUsers,
    startTyping,
    stopTyping,
    currentUserToken: token,
  };
};

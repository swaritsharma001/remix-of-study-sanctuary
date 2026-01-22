import React, { useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { MessageCircle, Send, X, Loader2, User, Smile, Users, Circle, Image, Paperclip } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { useChat } from '@/hooks/useChat';
import { useAuth } from '@/contexts/AuthContext';
import { format } from 'date-fns';

const EMOJI_LIST = ['👍', '❤️', '😂', '😮', '😢', '🔥', '👏', '🎉'];

const GlobalChat: React.FC = () => {
  const [isOpen, setIsOpen] = useState(false);
  const [messageInput, setMessageInput] = useState('');
  const [isSending, setIsSending] = useState(false);
  const [showOnlineUsers, setShowOnlineUsers] = useState(false);
  const [selectedImage, setSelectedImage] = useState<File | null>(null);
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const { 
    messages, 
    isLoading, 
    sendMessage, 
    uploadImage,
    isUploading,
    addReaction, 
    getMessageReactions,
    typingUsers,
    onlineUsers,
    startTyping,
    stopTyping,
    currentUserToken 
  } = useChat();
  const { isAuthenticated } = useAuth();
  const scrollRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Auto-scroll to bottom when messages load or new messages arrive
  useEffect(() => {
    if (scrollRef.current) {
      const scrollElement = scrollRef.current.querySelector('[data-radix-scroll-area-viewport]');
      if (scrollElement) {
        scrollElement.scrollTop = scrollElement.scrollHeight;
      }
    }
  }, [messages, typingUsers, isLoading]);

  // Scroll to bottom when chat opens
  useEffect(() => {
    if (isOpen) {
      // Small delay to ensure messages are rendered
      setTimeout(() => {
        if (scrollRef.current) {
          const scrollElement = scrollRef.current.querySelector('[data-radix-scroll-area-viewport]');
          if (scrollElement) {
            scrollElement.scrollTop = scrollElement.scrollHeight;
          }
        }
      }, 100);
      
      if (inputRef.current) {
        inputRef.current.focus();
      }
    }
  }, [isOpen]);

  const handleImageSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      if (file.size > 5 * 1024 * 1024) {
        alert('Image size should be less than 5MB');
        return;
      }
      setSelectedImage(file);
      const reader = new FileReader();
      reader.onloadend = () => {
        setImagePreview(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const clearImageSelection = () => {
    setSelectedImage(null);
    setImagePreview(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const handleSend = async () => {
    if ((!messageInput.trim() && !selectedImage) || isSending) return;

    setIsSending(true);
    stopTyping();
    
    let imageUrl: string | null = null;
    
    // Upload image if selected
    if (selectedImage) {
      imageUrl = await uploadImage(selectedImage);
      if (!imageUrl && !messageInput.trim()) {
        setIsSending(false);
        return;
      }
    }
    
    const success = await sendMessage(messageInput, imageUrl || undefined);
    if (success) {
      setMessageInput('');
      clearImageSelection();
    }
    setIsSending(false);
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setMessageInput(e.target.value);
    if (e.target.value.trim()) {
      startTyping();
    } else {
      stopTyping();
    }
  };

  const handleReaction = async (messageId: string, emoji: string) => {
    await addReaction(messageId, emoji);
  };

  // Group reactions by emoji
  const groupReactions = (messageId: string) => {
    const msgReactions = getMessageReactions(messageId);
    const grouped: { [emoji: string]: { count: number; users: string[]; hasOwn: boolean } } = {};
    
    msgReactions.forEach(r => {
      if (!grouped[r.emoji]) {
        grouped[r.emoji] = { count: 0, users: [], hasOwn: false };
      }
      grouped[r.emoji].count++;
      grouped[r.emoji].users.push(r.user_name);
      if (r.user_token === currentUserToken) {
        grouped[r.emoji].hasOwn = true;
      }
    });
    
    return grouped;
  };

  return (
    <>
      {/* Chat Toggle Button */}
      <motion.button
        initial={{ scale: 0 }}
        animate={{ scale: 1 }}
        whileHover={{ scale: 1.1 }}
        whileTap={{ scale: 0.9 }}
        onClick={() => setIsOpen(true)}
        className={`fixed bottom-6 right-6 z-50 flex h-14 w-14 items-center justify-center rounded-full bg-gradient-to-br from-primary to-secondary text-white shadow-lg ${isOpen ? 'hidden' : ''}`}
      >
        <MessageCircle className="h-6 w-6" />
        {messages.length > 0 && (
          <span className="absolute -right-1 -top-1 flex h-5 w-5 items-center justify-center rounded-full bg-red-500 text-xs font-bold">
            {messages.length > 99 ? '99+' : messages.length}
          </span>
        )}
      </motion.button>

      {/* Chat Window */}
      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0, y: 100, scale: 0.9 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 100, scale: 0.9 }}
            transition={{ type: 'spring', damping: 25, stiffness: 300 }}
            className="fixed bottom-6 right-6 z-50 flex h-[500px] w-[350px] flex-col overflow-hidden rounded-2xl border border-border bg-card shadow-2xl sm:w-[400px]"
          >
            {/* Header */}
            <div className="bg-gradient-to-r from-primary to-secondary p-4 text-white">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <MessageCircle className="h-5 w-5" />
                  <span className="font-semibold">StudyX Chat</span>
                </div>
                <button
                  onClick={() => setIsOpen(false)}
                  className="rounded-full p-1 transition-colors hover:bg-white/20"
                >
                  <X className="h-5 w-5" />
                </button>
              </div>
              
              {/* Online users bar */}
              <div className="mt-2 flex items-center justify-between">
                <Popover open={showOnlineUsers} onOpenChange={setShowOnlineUsers}>
                  <PopoverTrigger asChild>
                    <button className="flex items-center gap-1.5 rounded-full bg-white/20 px-3 py-1 text-xs transition-colors hover:bg-white/30">
                      <Circle className="h-2 w-2 fill-green-400 text-green-400" />
                      <span>{onlineUsers.length} online</span>
                      <Users className="h-3 w-3" />
                    </button>
                  </PopoverTrigger>
                  <PopoverContent className="w-56 p-2" side="bottom" align="start">
                    <div className="mb-2 text-xs font-semibold text-muted-foreground">
                      Online Users ({onlineUsers.length})
                    </div>
                    <ScrollArea className="max-h-40">
                      {onlineUsers.length === 0 ? (
                        <p className="py-2 text-center text-xs text-muted-foreground">
                          No users online
                        </p>
                      ) : (
                        <div className="space-y-1">
                          {onlineUsers.map((user) => (
                            <div
                              key={user.user_token}
                              className="flex items-center gap-2 rounded-md px-2 py-1.5 hover:bg-muted"
                            >
                              <Circle className="h-2 w-2 fill-green-500 text-green-500" />
                              <span className="text-sm">
                                {user.user_name}
                                {user.user_token === currentUserToken && (
                                  <span className="ml-1 text-xs text-muted-foreground">(you)</span>
                                )}
                              </span>
                            </div>
                          ))}
                        </div>
                      )}
                    </ScrollArea>
                  </PopoverContent>
                </Popover>
                
                <span className="rounded-full bg-white/20 px-2 py-0.5 text-xs">
                  {messages.length} messages
                </span>
              </div>
            </div>

            {/* Messages Area */}
            <ScrollArea className="flex-1 p-4" ref={scrollRef}>
              {isLoading ? (
                <div className="flex h-full items-center justify-center">
                  <Loader2 className="h-8 w-8 animate-spin text-primary" />
                </div>
              ) : messages.length === 0 ? (
                <div className="flex h-full flex-col items-center justify-center text-center text-muted-foreground">
                  <MessageCircle className="mb-2 h-12 w-12 opacity-50" />
                  <p>No messages yet</p>
                  <p className="text-sm">Be the first to say hello! 👋</p>
                </div>
              ) : (
                <div className="space-y-3">
                  {messages.map((msg) => {
                    const isOwn = msg.user_token === currentUserToken;
                    const groupedReactions = groupReactions(msg.id);
                    
                    return (
                      <motion.div
                        key={msg.id}
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        className={`flex ${isOwn ? 'justify-end' : 'justify-start'}`}
                      >
                        <div className="group relative max-w-[80%]">
                          <div
                            className={`rounded-2xl px-4 py-2 ${
                              isOwn
                                ? 'bg-gradient-to-br from-primary to-secondary text-white'
                                : 'bg-muted'
                            }`}
                          >
                            {!isOwn && (
                              <div className="mb-1 flex items-center gap-1 text-xs font-semibold text-primary">
                                <User className="h-3 w-3" />
                                {msg.user_name}
                              </div>
                            )}
                            
                            {/* Image */}
                            {msg.image_url && (
                              <a 
                                href={msg.image_url} 
                                target="_blank" 
                                rel="noopener noreferrer"
                                className="block mb-2"
                              >
                                <img 
                                  src={msg.image_url} 
                                  alt="Shared image" 
                                  className="rounded-lg max-w-full max-h-48 object-cover cursor-pointer hover:opacity-90 transition-opacity"
                                />
                              </a>
                            )}
                            
                            {msg.message && (
                              <p className="break-words text-sm">{msg.message}</p>
                            )}
                            <p
                              className={`mt-1 text-right text-[10px] ${
                                isOwn ? 'text-white/70' : 'text-muted-foreground'
                              }`}
                            >
                              {format(new Date(msg.created_at), 'hh:mm a')}
                            </p>
                          </div>

                          {/* Reactions display */}
                          {Object.keys(groupedReactions).length > 0 && (
                            <div className="mt-1 flex flex-wrap gap-1">
                              {Object.entries(groupedReactions).map(([emoji, data]) => (
                                <button
                                  key={emoji}
                                  onClick={() => handleReaction(msg.id, emoji)}
                                  className={`flex items-center gap-1 rounded-full px-2 py-0.5 text-xs transition-all ${
                                    data.hasOwn
                                      ? 'bg-primary/20 ring-1 ring-primary'
                                      : 'bg-muted hover:bg-muted/80'
                                  }`}
                                  title={data.users.join(', ')}
                                >
                                  <span>{emoji}</span>
                                  <span className="text-muted-foreground">{data.count}</span>
                                </button>
                              ))}
                            </div>
                          )}

                          {/* Add reaction button */}
                          {isAuthenticated && (
                            <Popover>
                              <PopoverTrigger asChild>
                                <button className="absolute -right-2 top-0 hidden rounded-full bg-card p-1 shadow-md transition-all hover:bg-muted group-hover:block">
                                  <Smile className="h-4 w-4 text-muted-foreground" />
                                </button>
                              </PopoverTrigger>
                              <PopoverContent className="w-auto p-2" side="top">
                                <div className="flex gap-1">
                                  {EMOJI_LIST.map((emoji) => (
                                    <button
                                      key={emoji}
                                      onClick={() => handleReaction(msg.id, emoji)}
                                      className="rounded p-1 text-lg transition-transform hover:scale-125 hover:bg-muted"
                                    >
                                      {emoji}
                                    </button>
                                  ))}
                                </div>
                              </PopoverContent>
                            </Popover>
                          )}
                        </div>
                      </motion.div>
                    );
                  })}

                  {/* Typing indicator */}
                  {typingUsers.length > 0 && (
                    <motion.div
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      className="flex justify-start"
                    >
                      <div className="rounded-2xl bg-muted px-4 py-2">
                        <div className="flex items-center gap-2">
                          <div className="flex gap-1">
                            <motion.span
                              animate={{ y: [0, -4, 0] }}
                              transition={{ duration: 0.6, repeat: Infinity, delay: 0 }}
                              className="h-2 w-2 rounded-full bg-primary"
                            />
                            <motion.span
                              animate={{ y: [0, -4, 0] }}
                              transition={{ duration: 0.6, repeat: Infinity, delay: 0.2 }}
                              className="h-2 w-2 rounded-full bg-primary"
                            />
                            <motion.span
                              animate={{ y: [0, -4, 0] }}
                              transition={{ duration: 0.6, repeat: Infinity, delay: 0.4 }}
                              className="h-2 w-2 rounded-full bg-primary"
                            />
                          </div>
                          <span className="text-xs text-muted-foreground">
                            {typingUsers.length === 1 
                              ? `${typingUsers[0].user_name} is typing...`
                              : `${typingUsers.length} people are typing...`
                            }
                          </span>
                        </div>
                      </div>
                    </motion.div>
                  )}
                </div>
              )}
            </ScrollArea>

            {/* Image Preview */}
            {imagePreview && (
              <div className="border-t border-border p-2">
                <div className="relative inline-block">
                  <img 
                    src={imagePreview} 
                    alt="Preview" 
                    className="h-20 w-20 rounded-lg object-cover"
                  />
                  <button
                    onClick={clearImageSelection}
                    className="absolute -right-2 -top-2 rounded-full bg-destructive p-1 text-white shadow-md"
                  >
                    <X className="h-3 w-3" />
                  </button>
                </div>
              </div>
            )}

            {/* Input Area */}
            <div className="border-t border-border p-4">
              {isAuthenticated ? (
                <div className="flex gap-2">
                  <input
                    type="file"
                    ref={fileInputRef}
                    onChange={handleImageSelect}
                    accept="image/*"
                    className="hidden"
                  />
                  <Button
                    type="button"
                    variant="ghost"
                    size="icon"
                    onClick={() => fileInputRef.current?.click()}
                    disabled={isSending || isUploading}
                    className="shrink-0"
                  >
                    <Image className="h-5 w-5 text-muted-foreground" />
                  </Button>
                  <Input
                    ref={inputRef}
                    value={messageInput}
                    onChange={handleInputChange}
                    onKeyPress={handleKeyPress}
                    onBlur={stopTyping}
                    placeholder="Type a message..."
                    disabled={isSending || isUploading}
                    className="flex-1"
                  />
                  <Button
                    onClick={handleSend}
                    disabled={(!messageInput.trim() && !selectedImage) || isSending || isUploading}
                    size="icon"
                    className="bg-gradient-to-br from-primary to-secondary"
                  >
                    {isSending || isUploading ? (
                      <Loader2 className="h-4 w-4 animate-spin" />
                    ) : (
                      <Send className="h-4 w-4" />
                    )}
                  </Button>
                </div>
              ) : (
                <div className="rounded-lg bg-muted p-3 text-center text-sm text-muted-foreground">
                  🔒 Please login to chat with others
                </div>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
};

export default GlobalChat;

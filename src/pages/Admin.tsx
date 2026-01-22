import { useState, useEffect } from 'react';
import { useQueryClient, useQuery } from '@tanstack/react-query';
import { useSubjects } from '@/hooks/useSubjects';
import { useLectures } from '@/hooks/useLectures';
import { useSubscriptionStats } from '@/hooks/useSubscriptionStats';
import { 
  addSubject, 
  addLecture, 
  deleteSubject, 
  deleteLecture,
  fetchKeys,
  createKey,
  deleteKey,
  AuthKey 
} from '@/services/api';
import { supabase } from '@/integrations/supabase/client';
import { usePushNotifications } from '@/hooks/usePushNotifications';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { 
  Plus, Trash2, BookOpen, Video, Loader2, Key, LogOut, Copy, Check, Users, 
  KeyRound, Shield, BarChart3, Bell, Send, Smartphone, ImagePlus, X, RefreshCw, 
  Globe, MessageSquare, Star, Reply, Mail, Sparkles, PartyPopper, Clock, 
  Trophy, Calendar, Eye, Zap, MessageCircle, User
} from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { motion, AnimatePresence } from 'framer-motion';

interface Feedback {
  id: string;
  name: string;
  email: string | null;
  message: string;
  rating: number | null;
  created_at: string;
  reply: string | null;
  replied_at: string | null;
  replied_by: string | null;
}

interface EmailTemplate {
  id: string;
  name: string;
  description: string;
  icon: React.ReactNode;
  color: string;
}

const ADMIN_EMAIL = 'admin@mintgram.live';
const ADMIN_PASSWORD = 'admin@mintgram.live';

const EMAIL_TEMPLATES: EmailTemplate[] = [
  { id: 'welcome', name: 'Welcome', description: 'Welcome new users to the platform', icon: <PartyPopper className="h-5 w-5" />, color: 'from-emerald-500/20 to-emerald-500/5 border-emerald-500/30' },
  { id: 'announcement', name: 'Announcement', description: 'Send important updates and news', icon: <Bell className="h-5 w-5" />, color: 'from-blue-500/20 to-blue-500/5 border-blue-500/30' },
  { id: 'reminder', name: 'Study Reminder', description: 'Remind users to continue studying', icon: <Clock className="h-5 w-5" />, color: 'from-amber-500/20 to-amber-500/5 border-amber-500/30' },
  { id: 'achievement', name: 'Achievement', description: 'Celebrate user milestones', icon: <Trophy className="h-5 w-5" />, color: 'from-violet-500/20 to-violet-500/5 border-violet-500/30' },
  { id: 'weekly-digest', name: 'Weekly Digest', description: 'Weekly summary of new content', icon: <Calendar className="h-5 w-5" />, color: 'from-rose-500/20 to-rose-500/5 border-rose-500/30' },
];

const Admin = () => {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const { data: subjects, isLoading: subjectsLoading } = useSubjects();
  const { data: subscriptionStats, isLoading: statsLoading, refetch: refetchStats } = useSubscriptionStats();
  const { isSupported: pushSupported, isSubscribed: pushSubscribed, subscribe: pushSubscribe } = usePushNotifications();
  
  // Feedback query
  const { data: feedbackList, isLoading: feedbackLoading, refetch: refetchFeedback } = useQuery({
    queryKey: ['admin-feedback'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('feedback')
        .select('*')
        .order('created_at', { ascending: false });
      if (error) throw error;
      return data as Feedback[];
    },
    enabled: false,
  });

  // Chat messages query
  const { data: chatMessages, isLoading: chatLoading, refetch: refetchChat } = useQuery({
    queryKey: ['admin-chat-messages'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('chat_messages')
        .select('*')
        .order('created_at', { ascending: false })
        .limit(200);
      if (error) throw error;
      return data as Array<{
        id: string;
        created_at: string;
        user_token: string;
        user_name: string;
        message: string;
        image_url: string | null;
      }>;
    },
    enabled: false,
  });
  
  // Admin auth state
  const [isAdminLoggedIn, setIsAdminLoggedIn] = useState(false);
  const [adminEmail, setAdminEmail] = useState('');
  const [adminPassword, setAdminPassword] = useState('');
  const [loginError, setLoginError] = useState('');
  
  // Keys state
  const [keys, setKeys] = useState<AuthKey[]>([]);
  const [keysLoading, setKeysLoading] = useState(false);
  const [keyName, setKeyName] = useState('');
  const [keyType, setKeyType] = useState<'trial' | 'permanent'>('permanent');
  const [creatingKey, setCreatingKey] = useState(false);
  const [copiedKey, setCopiedKey] = useState<string | null>(null);
  const [keyFilter, setKeyFilter] = useState<'all' | 'used' | 'unused'>('all');
  
  // Subject form state
  const [subjectName, setSubjectName] = useState('');
  const [subjectId, setSubjectId] = useState('');
  const [addingSubject, setAddingSubject] = useState(false);
  
  // Lecture form state
  const [lectureTitle, setLectureTitle] = useState('');
  const [lectureDuration, setLectureDuration] = useState('');
  const [lectureLink, setLectureLink] = useState('');
  const [selectedSubjectId, setSelectedSubjectId] = useState('');
  const [addingLecture, setAddingLecture] = useState(false);
  
  // Push notification state
  const [notificationTitle, setNotificationTitle] = useState('');
  const [notificationBody, setNotificationBody] = useState('');
  const [notificationUrl, setNotificationUrl] = useState('/');
  const [notificationImage, setNotificationImage] = useState<File | null>(null);
  const [notificationImagePreview, setNotificationImagePreview] = useState<string | null>(null);
  const [uploadingImage, setUploadingImage] = useState(false);
  const [sendingNotification, setSendingNotification] = useState(false);
  const [sendingTestPush, setSendingTestPush] = useState(false);
  
  // View lectures state
  const [viewSubjectId, setViewSubjectId] = useState('');
  const { data: lectures, isLoading: lecturesLoading } = useLectures(viewSubjectId || undefined);

  // Feedback reply state
  const [replyingToId, setReplyingToId] = useState<string | null>(null);
  const [replyMessage, setReplyMessage] = useState('');
  const [sendingReply, setSendingReply] = useState(false);

  // Email template state
  const [selectedTemplate, setSelectedTemplate] = useState<string | null>(null);
  const [emailTo, setEmailTo] = useState('');
  const [emailData, setEmailData] = useState({
    userName: '',
    title: '',
    message: '',
    highlights: '',
  });
  const [sendingEmail, setSendingEmail] = useState(false);
  const [previewEmail, setPreviewEmail] = useState(false);

  // Check admin session on mount
  useEffect(() => {
    const adminSession = localStorage.getItem('admin_session');
    if (adminSession === 'true') {
      setIsAdminLoggedIn(true);
    }
  }, []);

  // Load keys, feedback, and chat when admin logs in
  useEffect(() => {
    if (isAdminLoggedIn) {
      loadKeys();
      refetchFeedback();
      refetchChat();
      localStorage.setItem('adminLoggedIn', 'true');
    } else {
      localStorage.removeItem('adminLoggedIn');
    }
  }, [isAdminLoggedIn]);

  const loadKeys = async () => {
    setKeysLoading(true);
    try {
      const data = await fetchKeys();
      setKeys(data);
    } catch (error) {
      toast({ title: 'Error', description: 'Failed to load keys', variant: 'destructive' });
    } finally {
      setKeysLoading(false);
    }
  };

  const handleAdminLogin = (e: React.FormEvent) => {
    e.preventDefault();
    if (adminEmail === ADMIN_EMAIL && adminPassword === ADMIN_PASSWORD) {
      setIsAdminLoggedIn(true);
      localStorage.setItem('admin_session', 'true');
      setLoginError('');
    } else {
      setLoginError('Invalid email or password');
    }
  };

  const handleAdminLogout = () => {
    setIsAdminLoggedIn(false);
    localStorage.removeItem('admin_session');
    localStorage.removeItem('adminLoggedIn');
  };

  const handleDeleteChatMessage = async (messageId: string) => {
    try {
      const { error } = await supabase
        .from('chat_messages')
        .delete()
        .eq('id', messageId);
      
      if (error) throw error;
      
      toast({ title: 'Success', description: 'Message deleted' });
      refetchChat();
    } catch (error) {
      console.error('Delete chat error:', error);
      toast({ title: 'Error', description: 'Failed to delete message', variant: 'destructive' });
    }
  };

  const handleCreateKey = async () => {
    if (keyType === 'permanent' && !keyName.trim()) {
      toast({ title: 'Error', description: 'Name is required for permanent keys', variant: 'destructive' });
      return;
    }
    
    setCreatingKey(true);
    try {
      await createKey({ type: keyType, name: keyName || undefined });
      toast({ title: 'Success', description: 'Key created successfully' });
      setKeyName('');
      setKeyType('permanent');
      loadKeys();
    } catch (error) {
      toast({ title: 'Error', description: 'Failed to create key', variant: 'destructive' });
    } finally {
      setCreatingKey(false);
    }
  };

  const handleDeleteKey = async (id: string) => {
    try {
      await deleteKey(id);
      toast({ title: 'Success', description: 'Key deleted successfully' });
      loadKeys();
    } catch (error) {
      toast({ title: 'Error', description: 'Failed to delete key', variant: 'destructive' });
    }
  };

  const handleCopyKey = (key: string) => {
    navigator.clipboard.writeText(key);
    setCopiedKey(key);
    toast({ title: 'Copied!', description: 'Key copied to clipboard' });
    setTimeout(() => setCopiedKey(null), 2000);
  };

  const handleAddSubject = async () => {
    if (!subjectName.trim() || !subjectId.trim()) {
      toast({ title: 'Error', description: 'Please fill all fields', variant: 'destructive' });
      return;
    }
    
    setAddingSubject(true);
    try {
      await addSubject({ subject: subjectName, id: subjectId });
      toast({ title: 'Success', description: 'Subject added successfully' });
      setSubjectName('');
      setSubjectId('');
      queryClient.invalidateQueries({ queryKey: ['subjects'] });
    } catch (error) {
      toast({ title: 'Error', description: 'Failed to add subject', variant: 'destructive' });
    } finally {
      setAddingSubject(false);
    }
  };

  const handleDeleteSubject = async (id: string) => {
    try {
      await deleteSubject(id);
      toast({ title: 'Success', description: 'Subject deleted successfully' });
      queryClient.invalidateQueries({ queryKey: ['subjects'] });
    } catch (error) {
      toast({ title: 'Error', description: 'Failed to delete subject', variant: 'destructive' });
    }
  };

  const handleAddLecture = async () => {
    if (!lectureTitle.trim() || !lectureDuration.trim() || !lectureLink.trim() || !selectedSubjectId) {
      toast({ title: 'Error', description: 'Please fill all fields', variant: 'destructive' });
      return;
    }
    
    setAddingLecture(true);
    try {
      await addLecture({
        title: lectureTitle,
        duration: lectureDuration,
        subjectId: selectedSubjectId,
        link: lectureLink,
      });
      toast({ title: 'Success', description: 'Lecture added successfully' });
      setLectureTitle('');
      setLectureDuration('');
      setLectureLink('');
      setSelectedSubjectId('');
      queryClient.invalidateQueries({ queryKey: ['lectures'] });
      queryClient.invalidateQueries({ queryKey: ['subjects'] });
    } catch (error) {
      toast({ title: 'Error', description: 'Failed to add lecture', variant: 'destructive' });
    } finally {
      setAddingLecture(false);
    }
  };

  const handleDeleteLecture = async (id: string) => {
    try {
      await deleteLecture(id);
      toast({ title: 'Success', description: 'Lecture deleted successfully' });
      queryClient.invalidateQueries({ queryKey: ['lectures'] });
      queryClient.invalidateQueries({ queryKey: ['subjects'] });
    } catch (error) {
      toast({ title: 'Error', description: 'Failed to delete lecture', variant: 'destructive' });
    }
  };

  const formatDuration = (seconds: string) => {
    const sec = parseInt(seconds, 10);
    if (isNaN(sec)) return seconds;
    const mins = Math.floor(sec / 60);
    const secs = sec % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  const handleImageSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      if (file.size > 5 * 1024 * 1024) {
        toast({ title: 'Error', description: 'Image must be less than 5MB', variant: 'destructive' });
        return;
      }
      setNotificationImage(file);
      const reader = new FileReader();
      reader.onloadend = () => {
        setNotificationImagePreview(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const clearNotificationImage = () => {
    setNotificationImage(null);
    setNotificationImagePreview(null);
  };

  const uploadNotificationImage = async (): Promise<string | null> => {
    if (!notificationImage) return null;
    
    setUploadingImage(true);
    try {
      const fileName = `notification-${Date.now()}-${notificationImage.name}`;
      const { data, error } = await supabase.storage
        .from('notification-images')
        .upload(fileName, notificationImage);

      if (error) throw error;

      const { data: urlData } = supabase.storage
        .from('notification-images')
        .getPublicUrl(data.path);

      return urlData.publicUrl;
    } catch (error) {
      console.error('Image upload error:', error);
      toast({ title: 'Error', description: 'Failed to upload image', variant: 'destructive' });
      return null;
    } finally {
      setUploadingImage(false);
    }
  };

  const handleSendNotification = async () => {
    if (!notificationTitle.trim() || !notificationBody.trim()) {
      toast({ title: 'Error', description: 'Please fill title and message', variant: 'destructive' });
      return;
    }
    
    setSendingNotification(true);
    try {
      let imageUrl = null;
      if (notificationImage) {
        imageUrl = await uploadNotificationImage();
      }

      const { data, error } = await supabase.functions.invoke('send-push-notification', {
        body: {
          title: notificationTitle,
          body: notificationBody,
          url: notificationUrl || '/',
          image: imageUrl,
        },
      });

      if (error) throw error;

      toast({ 
        title: 'Notification Sent! 🔔', 
        description: `Sent to ${data?.sent || 0} subscribers` 
      });
      setNotificationTitle('');
      setNotificationBody('');
      setNotificationUrl('/');
      clearNotificationImage();
    } catch (error) {
      console.error('Send notification error:', error);
      toast({ title: 'Error', description: 'Failed to send notification', variant: 'destructive' });
    } finally {
      setSendingNotification(false);
    }
  };

  const handleTestPushToDevice = async () => {
    if (!pushSupported) {
      toast({ title: 'Not supported', description: 'Push notifications are not supported in this browser', variant: 'destructive' });
      return;
    }

    setSendingTestPush(true);
    try {
      if (!pushSubscribed) {
        const ok = await pushSubscribe();
        if (!ok) {
          toast({ title: 'Subscription failed', description: 'Could not subscribe to push notifications', variant: 'destructive' });
          return;
        }
      }

      const registration = await navigator.serviceWorker.getRegistration('/push/');
      const sub = await registration?.pushManager.getSubscription();
      if (!sub) {
        toast({ title: 'No subscription', description: 'Could not find your push subscription', variant: 'destructive' });
        return;
      }

      const { error } = await supabase.functions.invoke('send-push-notification', {
        body: {
          title: 'Test Notification 🚀',
          body: 'If you see this, push notifications are working!',
          url: '/admin',
          endpoint: sub.endpoint,
        },
      });

      if (error) throw error;

      toast({ title: 'Test sent!', description: 'Check your notifications' });
    } catch (err) {
      console.error('Test push error:', err);
      toast({ title: 'Error', description: 'Failed to send test push', variant: 'destructive' });
    } finally {
      setSendingTestPush(false);
    }
  };

  const handleSendReply = async (feedback: Feedback) => {
    if (!replyMessage.trim()) {
      toast({ title: 'Error', description: 'Please enter a reply message', variant: 'destructive' });
      return;
    }

    if (!feedback.email) {
      toast({ title: 'Error', description: 'This user did not provide an email address', variant: 'destructive' });
      return;
    }

    setSendingReply(true);
    try {
      const { error: emailError } = await supabase.functions.invoke('send-feedback-reply', {
        body: {
          feedbackId: feedback.id,
          userName: feedback.name,
          userEmail: feedback.email,
          originalMessage: feedback.message,
          originalRating: feedback.rating || 5,
          replyMessage: replyMessage.trim(),
        },
      });

      if (emailError) throw emailError;

      const { error: updateError } = await supabase
        .from('feedback')
        .update({
          reply: replyMessage.trim(),
          replied_at: new Date().toISOString(),
          replied_by: ADMIN_EMAIL,
        })
        .eq('id', feedback.id);

      if (updateError) throw updateError;

      toast({ title: 'Reply sent! ✉️', description: `Email sent to ${feedback.email}` });
      setReplyingToId(null);
      setReplyMessage('');
      refetchFeedback();
    } catch (error) {
      console.error('Reply error:', error);
      toast({ title: 'Error', description: 'Failed to send reply', variant: 'destructive' });
    } finally {
      setSendingReply(false);
    }
  };

  const handleSendEmail = async () => {
    if (!selectedTemplate || !emailTo.trim()) {
      toast({ title: 'Error', description: 'Please select a template and enter recipient email', variant: 'destructive' });
      return;
    }

    setSendingEmail(true);
    try {
      const highlightsArray = emailData.highlights
        .split('\n')
        .filter(h => h.trim())
        .map(h => h.trim());

      const { error } = await supabase.functions.invoke('send-email', {
        body: {
          to: emailTo.trim(),
          template: selectedTemplate,
          data: {
            userName: emailData.userName || 'Student',
            title: emailData.title || undefined,
            message: emailData.message || undefined,
            highlights: highlightsArray.length > 0 ? highlightsArray : undefined,
          },
        },
      });

      if (error) throw error;

      toast({ title: 'Email Sent! ✉️', description: `${selectedTemplate} email sent to ${emailTo}` });
      setEmailTo('');
      setEmailData({ userName: '', title: '', message: '', highlights: '' });
      setSelectedTemplate(null);
    } catch (error) {
      console.error('Email error:', error);
      toast({ title: 'Error', description: 'Failed to send email', variant: 'destructive' });
    } finally {
      setSendingEmail(false);
    }
  };

  if (!isAdminLoggedIn) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-background via-background to-primary/5 flex items-center justify-center p-4">
        <motion.div
          initial={{ opacity: 0, y: 20, scale: 0.95 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          transition={{ duration: 0.4, ease: 'easeOut' }}
          className="w-full max-w-md"
        >
          <Card className="border-2 border-primary/20 shadow-2xl shadow-primary/10 backdrop-blur-sm">
            <CardHeader className="text-center pb-2">
              <motion.div 
                initial={{ scale: 0 }}
                animate={{ scale: 1 }}
                transition={{ delay: 0.2, type: 'spring', stiffness: 200 }}
                className="mx-auto w-20 h-20 bg-gradient-to-br from-primary to-primary/60 rounded-2xl flex items-center justify-center mb-4 shadow-lg shadow-primary/30"
              >
                <Shield className="h-10 w-10 text-primary-foreground" />
              </motion.div>
              <CardTitle className="text-3xl font-bold bg-gradient-to-r from-foreground to-foreground/70 bg-clip-text">Admin Portal</CardTitle>
              <CardDescription className="text-muted-foreground mt-2">Enter your credentials to access the dashboard</CardDescription>
            </CardHeader>
            <CardContent className="pt-4">
              <form onSubmit={handleAdminLogin} className="space-y-4">
                <div className="space-y-2">
                  <label className="text-sm font-medium text-foreground/80">Email</label>
                  <Input
                    type="email"
                    placeholder="admin@example.com"
                    value={adminEmail}
                    onChange={(e) => setAdminEmail(e.target.value)}
                    className="h-12 bg-muted/50 border-muted-foreground/20 focus:border-primary transition-colors"
                  />
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-medium text-foreground/80">Password</label>
                  <Input
                    type="password"
                    placeholder="••••••••"
                    value={adminPassword}
                    onChange={(e) => setAdminPassword(e.target.value)}
                    className="h-12 bg-muted/50 border-muted-foreground/20 focus:border-primary transition-colors"
                  />
                </div>
                <AnimatePresence>
                  {loginError && (
                    <motion.p 
                      initial={{ opacity: 0, y: -10 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, y: -10 }}
                      className="text-destructive text-sm text-center bg-destructive/10 py-2 rounded-lg"
                    >
                      {loginError}
                    </motion.p>
                  )}
                </AnimatePresence>
                <Button type="submit" className="w-full h-12 text-base font-semibold shadow-lg shadow-primary/20 hover:shadow-primary/30 transition-all">
                  <Key className="h-4 w-4 mr-2" />
                  Sign In
                </Button>
              </form>
            </CardContent>
          </Card>
        </motion.div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-background to-muted/30 pt-20 pb-10 px-4">
      <div className="max-w-6xl mx-auto">
        {/* Header */}
        <motion.div 
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="flex items-center justify-between mb-8"
        >
          <div className="flex items-center gap-4">
            <div className="h-12 w-12 bg-gradient-to-br from-primary to-primary/60 rounded-xl flex items-center justify-center shadow-lg shadow-primary/20">
              <Zap className="h-6 w-6 text-primary-foreground" />
            </div>
            <div>
              <h1 className="text-3xl font-bold text-foreground">Admin Dashboard</h1>
              <p className="text-muted-foreground text-sm">Manage your platform</p>
            </div>
          </div>
          <Button variant="outline" onClick={handleAdminLogout} className="gap-2 hover:bg-destructive/10 hover:text-destructive hover:border-destructive/30 transition-colors">
            <LogOut className="h-4 w-4" />
            Logout
          </Button>
        </motion.div>
        
        <Tabs defaultValue="keys" className="w-full">
          <TabsList className="grid w-full grid-cols-8 mb-8 h-auto p-1 bg-muted/50 backdrop-blur-sm">
            {[
              { value: 'keys', icon: Key, label: 'Keys' },
              { value: 'subjects', icon: BookOpen, label: 'Subjects' },
              { value: 'lectures', icon: Video, label: 'Lectures' },
              { value: 'chat', icon: MessageCircle, label: 'Chat' },
              { value: 'feedback', icon: MessageSquare, label: 'Feedback' },
              { value: 'emails', icon: Mail, label: 'Emails' },
              { value: 'notifications', icon: Bell, label: 'Push' },
              { value: 'view', icon: Eye, label: 'View' },
            ].map((tab) => (
              <TabsTrigger 
                key={tab.value} 
                value={tab.value}
                className="data-[state=active]:bg-background data-[state=active]:shadow-sm py-2.5 gap-1.5"
              >
                <tab.icon className="h-4 w-4" />
                <span className="hidden sm:inline">{tab.label}</span>
              </TabsTrigger>
            ))}
          </TabsList>
          
          {/* Keys Tab */}
          <TabsContent value="keys">
            <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }}>
              {/* Key Statistics */}
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
                {[
                  { label: 'Total Keys', value: keys.length, icon: Key, color: 'from-primary/20 to-primary/5 border-primary/30', textColor: 'text-primary' },
                  { label: 'Available', value: keys.filter(k => !k.used).length, icon: KeyRound, color: 'from-emerald-500/20 to-emerald-500/5 border-emerald-500/30', textColor: 'text-emerald-600 dark:text-emerald-400' },
                  { label: 'Used', value: keys.filter(k => k.used).length, icon: Users, color: 'from-rose-500/20 to-rose-500/5 border-rose-500/30', textColor: 'text-rose-600 dark:text-rose-400' },
                  { label: 'Permanent', value: keys.filter(k => k.type === 'permanent').length, icon: Shield, color: 'from-violet-500/20 to-violet-500/5 border-violet-500/30', textColor: 'text-violet-600 dark:text-violet-400' },
                ].map((stat) => (
                  <Card key={stat.label} className={`bg-gradient-to-br ${stat.color} border transition-all hover:shadow-md`}>
                    <CardContent className="pt-4">
                      <div className="flex items-center justify-between">
                        <div>
                          <p className="text-sm text-muted-foreground">{stat.label}</p>
                          <p className={`text-2xl font-bold ${stat.textColor}`}>{stat.value}</p>
                        </div>
                        <div className={`h-10 w-10 rounded-xl bg-background/50 flex items-center justify-center`}>
                          <stat.icon className={`h-5 w-5 ${stat.textColor}`} />
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>

              <Card className="border-2 shadow-lg">
                <CardHeader className="bg-muted/30">
                  <CardTitle className="flex items-center gap-2">
                    <div className="h-8 w-8 bg-primary/10 rounded-lg flex items-center justify-center">
                      <Key className="h-4 w-4 text-primary" />
                    </div>
                    Create New Auth Key
                  </CardTitle>
                </CardHeader>
                <CardContent className="pt-6 space-y-4">
                  <Input
                    placeholder={keyType === 'permanent' ? "Name of student (required)" : "Name of student (optional)"}
                    value={keyName}
                    onChange={(e) => setKeyName(e.target.value)}
                    required={keyType === 'permanent'}
                    className="h-11"
                  />
                  <Select value={keyType} onValueChange={(v) => setKeyType(v as 'trial' | 'permanent')}>
                    <SelectTrigger className="h-11">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="permanent">Permanent (365 days)</SelectItem>
                      <SelectItem value="trial">Trial (24 hours)</SelectItem>
                    </SelectContent>
                  </Select>
                  <Button onClick={handleCreateKey} disabled={creatingKey} className="w-full h-11">
                    {creatingKey ? (
                      <Loader2 className="h-4 w-4 animate-spin mr-2" />
                    ) : (
                      <Plus className="h-4 w-4 mr-2" />
                    )}
                    Create Key
                  </Button>
                </CardContent>
              </Card>

              {/* Keys List */}
              <Card className="mt-6 border-2 shadow-lg">
                <CardHeader className="bg-muted/30">
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                    <CardTitle className="flex items-center gap-2">
                      <div className="h-8 w-8 bg-primary/10 rounded-lg flex items-center justify-center">
                        <BarChart3 className="h-4 w-4 text-primary" />
                      </div>
                      Auth Keys Management
                    </CardTitle>
                    <Button variant="outline" size="sm" onClick={loadKeys} className="gap-2">
                      <RefreshCw className={`h-4 w-4 ${keysLoading ? 'animate-spin' : ''}`} />
                      Refresh
                    </Button>
                  </div>
                  <div className="flex gap-2 mt-4">
                    {[
                      { filter: 'all' as const, label: 'All', count: keys.length },
                      { filter: 'unused' as const, label: 'Available', count: keys.filter(k => !k.used).length, color: 'bg-emerald-500/20 text-emerald-700 dark:text-emerald-300' },
                      { filter: 'used' as const, label: 'Used', count: keys.filter(k => k.used).length, color: 'bg-rose-500/20 text-rose-700 dark:text-rose-300' },
                    ].map((item) => (
                      <Button
                        key={item.filter}
                        variant={keyFilter === item.filter ? 'default' : 'outline'}
                        size="sm"
                        onClick={() => setKeyFilter(item.filter)}
                        className="flex-1 sm:flex-none gap-2"
                      >
                        {item.label}
                        <Badge variant="secondary" className={item.color || ''}>
                          {item.count}
                        </Badge>
                      </Button>
                    ))}
                  </div>
                </CardHeader>
                <CardContent className="pt-4">
                  {keysLoading ? (
                    <div className="flex justify-center py-12">
                      <Loader2 className="h-8 w-8 animate-spin text-primary" />
                    </div>
                  ) : (() => {
                    const filteredKeys = keys.filter(key => {
                      if (keyFilter === 'used') return key.used;
                      if (keyFilter === 'unused') return !key.used;
                      return true;
                    });
                    
                    return filteredKeys.length > 0 ? (
                      <div className="space-y-3">
                        <AnimatePresence>
                          {filteredKeys.map((key, index) => (
                            <motion.div
                              key={key._id}
                              initial={{ opacity: 0, y: 10 }}
                              animate={{ opacity: 1, y: 0 }}
                              exit={{ opacity: 0, x: -20 }}
                              transition={{ delay: index * 0.05 }}
                              className={`flex items-center justify-between p-4 rounded-xl border-2 transition-all hover:shadow-md ${
                                key.used 
                                  ? 'bg-gradient-to-r from-rose-500/5 to-transparent border-rose-500/20' 
                                  : 'bg-gradient-to-r from-emerald-500/5 to-transparent border-emerald-500/20'
                              }`}
                            >
                              <div className="flex-1 min-w-0">
                                <div className="flex items-center gap-2 mb-2">
                                  <code className="text-sm font-mono bg-muted px-3 py-1.5 rounded-lg truncate max-w-[200px] sm:max-w-none">
                                    {key.authKey}
                                  </code>
                                  <Button
                                    variant="ghost"
                                    size="icon"
                                    className="h-8 w-8 shrink-0"
                                    onClick={() => handleCopyKey(key.authKey)}
                                  >
                                    {copiedKey === key.authKey ? (
                                      <Check className="h-4 w-4 text-emerald-500" />
                                    ) : (
                                      <Copy className="h-4 w-4" />
                                    )}
                                  </Button>
                                </div>
                                <div className="flex flex-wrap items-center gap-2 text-sm">
                                  {key.name && (
                                    <span className="text-muted-foreground font-medium">{key.name}</span>
                                  )}
                                  <Badge variant={key.type === 'permanent' ? 'default' : 'secondary'} className="font-medium">
                                    {key.type}
                                  </Badge>
                                  <Badge 
                                    variant="outline"
                                    className={key.used 
                                      ? 'border-rose-500/50 text-rose-600 dark:text-rose-400 bg-rose-500/10' 
                                      : 'border-emerald-500/50 text-emerald-600 dark:text-emerald-400 bg-emerald-500/10'
                                    }
                                  >
                                    {key.used ? '● Used' : '○ Available'}
                                  </Badge>
                                </div>
                              </div>
                              <Button
                                variant="destructive"
                                size="icon"
                                className="shrink-0 ml-2"
                                onClick={() => handleDeleteKey(key._id)}
                              >
                                <Trash2 className="h-4 w-4" />
                              </Button>
                            </motion.div>
                          ))}
                        </AnimatePresence>
                      </div>
                    ) : (
                      <div className="text-center py-12">
                        <KeyRound className="h-12 w-12 mx-auto text-muted-foreground/30 mb-3" />
                        <p className="text-muted-foreground">
                          {keyFilter === 'used' ? 'No used keys found' : keyFilter === 'unused' ? 'No available keys found' : 'No keys found'}
                        </p>
                      </div>
                    );
                  })()}
                </CardContent>
              </Card>
            </motion.div>
          </TabsContent>
          
          {/* Subjects Tab */}
          <TabsContent value="subjects">
            <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }}>
              <Card className="border-2 shadow-lg">
                <CardHeader className="bg-muted/30">
                  <CardTitle className="flex items-center gap-2">
                    <div className="h-8 w-8 bg-primary/10 rounded-lg flex items-center justify-center">
                      <BookOpen className="h-4 w-4 text-primary" />
                    </div>
                    Add New Subject
                  </CardTitle>
                </CardHeader>
                <CardContent className="pt-6 space-y-4">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <Input
                      placeholder="Subject Name (e.g., Physics)"
                      value={subjectName}
                      onChange={(e) => setSubjectName(e.target.value)}
                      className="h-11"
                    />
                    <Input
                      placeholder="Subject ID (e.g., physics)"
                      value={subjectId}
                      onChange={(e) => setSubjectId(e.target.value)}
                      className="h-11"
                    />
                  </div>
                  <Button onClick={handleAddSubject} disabled={addingSubject} className="w-full h-11">
                    {addingSubject ? (
                      <Loader2 className="h-4 w-4 animate-spin mr-2" />
                    ) : (
                      <Plus className="h-4 w-4 mr-2" />
                    )}
                    Add Subject
                  </Button>
                </CardContent>
              </Card>

              <Card className="mt-6 border-2 shadow-lg">
                <CardHeader className="bg-muted/30">
                  <CardTitle>All Subjects</CardTitle>
                </CardHeader>
                <CardContent className="pt-4">
                  {subjectsLoading ? (
                    <div className="flex justify-center py-12">
                      <Loader2 className="h-8 w-8 animate-spin text-primary" />
                    </div>
                  ) : subjects && subjects.length > 0 ? (
                    <div className="space-y-3">
                      {subjects.map((subject, index) => (
                        <motion.div
                          key={subject._id}
                          initial={{ opacity: 0, y: 10 }}
                          animate={{ opacity: 1, y: 0 }}
                          transition={{ delay: index * 0.05 }}
                          className="flex items-center justify-between p-4 bg-gradient-to-r from-muted/50 to-transparent rounded-xl border hover:shadow-md transition-all"
                        >
                          <div className="flex items-center gap-3">
                            <div className="h-10 w-10 bg-primary/10 rounded-lg flex items-center justify-center">
                              <BookOpen className="h-5 w-5 text-primary" />
                            </div>
                            <div>
                              <p className="font-semibold">{subject.subject}</p>
                              <p className="text-sm text-muted-foreground">ID: {subject.id}</p>
                            </div>
                            <Badge variant="secondary" className="ml-2">{subject.totalVideos} videos</Badge>
                          </div>
                          <Button
                            variant="destructive"
                            size="icon"
                            onClick={() => handleDeleteSubject(subject._id)}
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </motion.div>
                      ))}
                    </div>
                  ) : (
                    <div className="text-center py-12">
                      <BookOpen className="h-12 w-12 mx-auto text-muted-foreground/30 mb-3" />
                      <p className="text-muted-foreground">No subjects found</p>
                    </div>
                  )}
                </CardContent>
              </Card>
            </motion.div>
          </TabsContent>
          
          {/* Lectures Tab */}
          <TabsContent value="lectures">
            <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }}>
              <Card className="border-2 shadow-lg">
                <CardHeader className="bg-muted/30">
                  <CardTitle className="flex items-center gap-2">
                    <div className="h-8 w-8 bg-primary/10 rounded-lg flex items-center justify-center">
                      <Video className="h-4 w-4 text-primary" />
                    </div>
                    Add New Lecture
                  </CardTitle>
                </CardHeader>
                <CardContent className="pt-6 space-y-4">
                  <Select value={selectedSubjectId} onValueChange={setSelectedSubjectId}>
                    <SelectTrigger className="h-11">
                      <SelectValue placeholder="Select Subject" />
                    </SelectTrigger>
                    <SelectContent>
                      {subjects?.map((subject) => (
                        <SelectItem key={subject._id} value={subject.id}>
                          {subject.subject}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <Input
                    placeholder="Lecture Title"
                    value={lectureTitle}
                    onChange={(e) => setLectureTitle(e.target.value)}
                    className="h-11"
                  />
                  <Input
                    placeholder="Duration in seconds (e.g., 300)"
                    value={lectureDuration}
                    onChange={(e) => setLectureDuration(e.target.value)}
                    className="h-11"
                  />
                  <Input
                    placeholder="Video Link (YouTube or HLS)"
                    value={lectureLink}
                    onChange={(e) => setLectureLink(e.target.value)}
                    className="h-11"
                  />
                  <Button onClick={handleAddLecture} disabled={addingLecture} className="w-full h-11">
                    {addingLecture ? (
                      <Loader2 className="h-4 w-4 animate-spin mr-2" />
                    ) : (
                      <Plus className="h-4 w-4 mr-2" />
                    )}
                    Add Lecture
                  </Button>
                </CardContent>
              </Card>
            </motion.div>
          </TabsContent>
          
          {/* View Tab */}
          <TabsContent value="view">
            <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }}>
              <Card className="border-2 shadow-lg">
                <CardHeader className="bg-muted/30">
                  <CardTitle className="flex items-center gap-2">
                    <div className="h-8 w-8 bg-primary/10 rounded-lg flex items-center justify-center">
                      <Eye className="h-4 w-4 text-primary" />
                    </div>
                    View Lectures by Subject
                  </CardTitle>
                </CardHeader>
                <CardContent className="pt-6">
                  <Select value={viewSubjectId} onValueChange={setViewSubjectId}>
                    <SelectTrigger className="h-11">
                      <SelectValue placeholder="Select Subject to View Lectures" />
                    </SelectTrigger>
                    <SelectContent>
                      {subjects?.map((subject) => (
                        <SelectItem key={subject._id} value={subject.id}>
                          {subject.subject}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>

                  {viewSubjectId && (
                    <div className="mt-6">
                      {lecturesLoading ? (
                        <div className="flex justify-center py-12">
                          <Loader2 className="h-8 w-8 animate-spin text-primary" />
                        </div>
                      ) : lectures && lectures.length > 0 ? (
                        <div className="space-y-3">
                          {lectures.map((lecture, index) => (
                            <motion.div
                              key={lecture._id}
                              initial={{ opacity: 0, y: 10 }}
                              animate={{ opacity: 1, y: 0 }}
                              transition={{ delay: index * 0.05 }}
                              className="flex items-center justify-between p-4 bg-gradient-to-r from-muted/50 to-transparent rounded-xl border hover:shadow-md transition-all"
                            >
                              <div className="flex items-center gap-3">
                                <div className="h-10 w-10 bg-primary/10 rounded-lg flex items-center justify-center">
                                  <Video className="h-5 w-5 text-primary" />
                                </div>
                                <div>
                                  <p className="font-semibold">{lecture.title}</p>
                                  <p className="text-sm text-muted-foreground">
                                    Duration: {formatDuration(lecture.duration)}
                                  </p>
                                </div>
                              </div>
                              <Button
                                variant="destructive"
                                size="icon"
                                onClick={() => handleDeleteLecture(lecture._id)}
                              >
                                <Trash2 className="h-4 w-4" />
                              </Button>
                            </motion.div>
                          ))}
                        </div>
                      ) : (
                        <div className="text-center py-12">
                          <Video className="h-12 w-12 mx-auto text-muted-foreground/30 mb-3" />
                          <p className="text-muted-foreground">No lectures found for this subject</p>
                        </div>
                      )}
                    </div>
                  )}
                </CardContent>
              </Card>
            </motion.div>
          </TabsContent>

          {/* Chat Tab */}
          <TabsContent value="chat">
            <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }}>
              <Card className="border-2 shadow-lg">
                <CardHeader className="bg-muted/30">
                  <div className="flex items-center justify-between">
                    <CardTitle className="flex items-center gap-2">
                      <div className="h-8 w-8 bg-primary/10 rounded-lg flex items-center justify-center">
                        <MessageCircle className="h-4 w-4 text-primary" />
                      </div>
                      Chat Messages
                      {chatMessages && (
                        <Badge variant="secondary" className="ml-2">{chatMessages.length}</Badge>
                      )}
                    </CardTitle>
                    <Button variant="outline" size="sm" onClick={() => refetchChat()} className="gap-2">
                      <RefreshCw className={`h-4 w-4 ${chatLoading ? 'animate-spin' : ''}`} />
                      Refresh
                    </Button>
                  </div>
                </CardHeader>
                <CardContent className="pt-4">
                  {chatLoading ? (
                    <div className="flex justify-center py-12">
                      <Loader2 className="h-8 w-8 animate-spin text-primary" />
                    </div>
                  ) : chatMessages && chatMessages.length > 0 ? (
                    <div className="space-y-3 max-h-[600px] overflow-y-auto">
                      {chatMessages.map((msg, index) => (
                        <motion.div
                          key={msg.id}
                          initial={{ opacity: 0, y: 10 }}
                          animate={{ opacity: 1, y: 0 }}
                          transition={{ delay: index * 0.02 }}
                          className="flex items-start justify-between gap-4 p-4 bg-gradient-to-r from-muted/50 to-transparent rounded-xl border hover:shadow-md transition-all"
                        >
                          <div className="flex items-start gap-3 flex-1 min-w-0">
                            <div className="h-10 w-10 bg-primary/10 rounded-full flex items-center justify-center shrink-0">
                              <User className="h-5 w-5 text-primary" />
                            </div>
                            <div className="min-w-0 flex-1">
                              <div className="flex items-center gap-2 mb-1">
                                <p className="font-semibold text-sm">{msg.user_name}</p>
                                <span className="text-xs text-muted-foreground">
                                  {new Date(msg.created_at).toLocaleString()}
                                </span>
                              </div>
                              {msg.message && (
                                <p className="text-sm text-foreground/80 break-words">{msg.message}</p>
                              )}
                              {msg.image_url && (
                                <a href={msg.image_url} target="_blank" rel="noopener noreferrer" className="block mt-2">
                                  <img 
                                    src={msg.image_url} 
                                    alt="Chat image" 
                                    className="max-w-[200px] max-h-[150px] rounded-lg object-cover hover:opacity-80 transition-opacity"
                                  />
                                </a>
                              )}
                            </div>
                          </div>
                          <Button
                            variant="destructive"
                            size="icon"
                            onClick={() => handleDeleteChatMessage(msg.id)}
                            className="shrink-0"
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </motion.div>
                      ))}
                    </div>
                  ) : (
                    <div className="text-center py-12">
                      <MessageCircle className="h-12 w-12 mx-auto text-muted-foreground/30 mb-3" />
                      <p className="text-muted-foreground">No chat messages found</p>
                    </div>
                  )}
                </CardContent>
              </Card>
            </motion.div>
          </TabsContent>

          {/* Feedback Tab */}
          <TabsContent value="feedback">
            <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }}>
              <Card className="border-2 shadow-lg">
                <CardHeader className="bg-muted/30">
                  <div className="flex items-center justify-between">
                    <CardTitle className="flex items-center gap-2">
                      <div className="h-8 w-8 bg-primary/10 rounded-lg flex items-center justify-center">
                        <MessageSquare className="h-4 w-4 text-primary" />
                      </div>
                      User Feedback
                      {feedbackList && (
                        <Badge variant="secondary" className="ml-2">{feedbackList.length}</Badge>
                      )}
                    </CardTitle>
                    <Button variant="outline" size="sm" onClick={() => refetchFeedback()} className="gap-2">
                      <RefreshCw className={`h-4 w-4 ${feedbackLoading ? 'animate-spin' : ''}`} />
                      Refresh
                    </Button>
                  </div>
                </CardHeader>
                <CardContent className="pt-4">
                  {feedbackLoading ? (
                    <div className="flex justify-center py-12">
                      <Loader2 className="h-8 w-8 animate-spin text-primary" />
                    </div>
                  ) : feedbackList && feedbackList.length > 0 ? (
                    <div className="space-y-4">
                      {feedbackList.map((feedback, index) => (
                        <motion.div
                          key={feedback.id}
                          initial={{ opacity: 0, y: 10 }}
                          animate={{ opacity: 1, y: 0 }}
                          transition={{ delay: index * 0.05 }}
                        >
                          <Card className={`border-2 transition-all hover:shadow-md ${feedback.reply ? 'border-primary/20 bg-primary/5' : ''}`}>
                            <CardContent className="pt-4">
                              <div className="space-y-3">
                                {/* Header */}
                                <div className="flex items-start justify-between gap-4">
                                  <div className="flex-1">
                                    <div className="flex items-center gap-2 mb-1">
                                      <span className="font-semibold">{feedback.name}</span>
                                      {feedback.email && (
                                        <span className="text-sm text-muted-foreground">({feedback.email})</span>
                                      )}
                                    </div>
                                    <div className="flex items-center gap-3 flex-wrap">
                                      {feedback.rating && (
                                        <div className="flex items-center gap-0.5">
                                          {[1, 2, 3, 4, 5].map((i) => (
                                            <Star
                                              key={i}
                                              className={`h-4 w-4 ${
                                                i <= feedback.rating!
                                                  ? 'fill-yellow-400 text-yellow-400'
                                                  : 'text-muted-foreground/30'
                                              }`}
                                            />
                                          ))}
                                        </div>
                                      )}
                                      {feedback.reply && (
                                        <Badge variant="secondary" className="bg-primary/10 text-primary gap-1">
                                          <Check className="h-3 w-3" />
                                          Replied
                                        </Badge>
                                      )}
                                      <span className="text-sm text-muted-foreground">
                                        {new Date(feedback.created_at).toLocaleDateString('en-US', {
                                          month: 'short',
                                          day: 'numeric',
                                          year: 'numeric',
                                          hour: '2-digit',
                                          minute: '2-digit',
                                        })}
                                      </span>
                                    </div>
                                  </div>
                                  {feedback.email && !feedback.reply && (
                                    <Button
                                      variant="outline"
                                      size="sm"
                                      onClick={() => {
                                        setReplyingToId(replyingToId === feedback.id ? null : feedback.id);
                                        setReplyMessage('');
                                      }}
                                      className="shrink-0 gap-1"
                                    >
                                      <Reply className="h-4 w-4" />
                                      Reply
                                    </Button>
                                  )}
                                </div>

                                {/* Message */}
                                <div className="bg-muted/50 rounded-xl p-4">
                                  <p className="whitespace-pre-wrap">{feedback.message}</p>
                                </div>

                                {/* Existing reply */}
                                {feedback.reply && (
                                  <div className="bg-primary/10 border-l-4 border-primary rounded-xl p-4">
                                    <div className="flex items-center gap-2 mb-2">
                                      <Mail className="h-4 w-4 text-primary" />
                                      <span className="text-sm font-medium text-primary">Your Reply</span>
                                      <span className="text-xs text-muted-foreground">
                                        {feedback.replied_at && new Date(feedback.replied_at).toLocaleDateString()}
                                      </span>
                                    </div>
                                    <p className="whitespace-pre-wrap text-sm">{feedback.reply}</p>
                                  </div>
                                )}

                                {/* Reply form */}
                                <AnimatePresence>
                                  {replyingToId === feedback.id && (
                                    <motion.div
                                      initial={{ opacity: 0, height: 0 }}
                                      animate={{ opacity: 1, height: 'auto' }}
                                      exit={{ opacity: 0, height: 0 }}
                                      className="space-y-3 overflow-hidden"
                                    >
                                      <Textarea
                                        placeholder={`Write your reply to ${feedback.name}...`}
                                        value={replyMessage}
                                        onChange={(e) => setReplyMessage(e.target.value)}
                                        className="min-h-[100px]"
                                      />
                                      <div className="flex items-center gap-2">
                                        <Button
                                          onClick={() => handleSendReply(feedback)}
                                          disabled={sendingReply || !replyMessage.trim()}
                                          className="gap-2"
                                        >
                                          {sendingReply ? (
                                            <>
                                              <Loader2 className="h-4 w-4 animate-spin" />
                                              Sending...
                                            </>
                                          ) : (
                                            <>
                                              <Send className="h-4 w-4" />
                                              Send Reply
                                            </>
                                          )}
                                        </Button>
                                        <Button
                                          variant="ghost"
                                          onClick={() => {
                                            setReplyingToId(null);
                                            setReplyMessage('');
                                          }}
                                        >
                                          Cancel
                                        </Button>
                                      </div>
                                    </motion.div>
                                  )}
                                </AnimatePresence>
                              </div>
                            </CardContent>
                          </Card>
                        </motion.div>
                      ))}
                    </div>
                  ) : (
                    <div className="text-center py-12">
                      <MessageSquare className="h-12 w-12 mx-auto text-muted-foreground/30 mb-3" />
                      <p className="text-muted-foreground">No feedback received yet</p>
                    </div>
                  )}
                </CardContent>
              </Card>
            </motion.div>
          </TabsContent>

          {/* Email Templates Tab */}
          <TabsContent value="emails">
            <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }}>
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {/* Template Selection */}
                <Card className="border-2 shadow-lg">
                  <CardHeader className="bg-muted/30">
                    <CardTitle className="flex items-center gap-2">
                      <div className="h-8 w-8 bg-primary/10 rounded-lg flex items-center justify-center">
                        <Sparkles className="h-4 w-4 text-primary" />
                      </div>
                      Email Templates
                    </CardTitle>
                    <CardDescription>Select a template to send</CardDescription>
                  </CardHeader>
                  <CardContent className="pt-4 space-y-3">
                    {EMAIL_TEMPLATES.map((template) => (
                      <motion.button
                        key={template.id}
                        whileHover={{ scale: 1.01 }}
                        whileTap={{ scale: 0.99 }}
                        onClick={() => setSelectedTemplate(template.id)}
                        className={`w-full p-4 rounded-xl border-2 text-left transition-all ${
                          selectedTemplate === template.id
                            ? `bg-gradient-to-r ${template.color} border-primary shadow-md`
                            : 'bg-muted/30 border-transparent hover:border-muted-foreground/20'
                        }`}
                      >
                        <div className="flex items-center gap-3">
                          <div className={`h-10 w-10 rounded-lg flex items-center justify-center ${
                            selectedTemplate === template.id ? 'bg-primary/20' : 'bg-muted'
                          }`}>
                            {template.icon}
                          </div>
                          <div className="flex-1">
                            <p className="font-semibold">{template.name}</p>
                            <p className="text-sm text-muted-foreground">{template.description}</p>
                          </div>
                          {selectedTemplate === template.id && (
                            <Check className="h-5 w-5 text-primary" />
                          )}
                        </div>
                      </motion.button>
                    ))}
                  </CardContent>
                </Card>

                {/* Email Composer */}
                <Card className="border-2 shadow-lg">
                  <CardHeader className="bg-muted/30">
                    <CardTitle className="flex items-center gap-2">
                      <div className="h-8 w-8 bg-primary/10 rounded-lg flex items-center justify-center">
                        <Mail className="h-4 w-4 text-primary" />
                      </div>
                      Compose Email
                    </CardTitle>
                    <CardDescription>
                      {selectedTemplate 
                        ? `Sending: ${EMAIL_TEMPLATES.find(t => t.id === selectedTemplate)?.name} template` 
                        : 'Select a template first'}
                    </CardDescription>
                  </CardHeader>
                  <CardContent className="pt-4 space-y-4">
                    <div className="space-y-2">
                      <label className="text-sm font-medium">Recipient Email *</label>
                      <Input
                        type="email"
                        placeholder="student@example.com"
                        value={emailTo}
                        onChange={(e) => setEmailTo(e.target.value)}
                        className="h-11"
                      />
                    </div>
                    <div className="space-y-2">
                      <label className="text-sm font-medium">User Name</label>
                      <Input
                        placeholder="Student name (default: Student)"
                        value={emailData.userName}
                        onChange={(e) => setEmailData({ ...emailData, userName: e.target.value })}
                        className="h-11"
                      />
                    </div>
                    {(selectedTemplate === 'announcement' || selectedTemplate === 'achievement') && (
                      <div className="space-y-2">
                        <label className="text-sm font-medium">Title</label>
                        <Input
                          placeholder="Email title/subject"
                          value={emailData.title}
                          onChange={(e) => setEmailData({ ...emailData, title: e.target.value })}
                          className="h-11"
                        />
                      </div>
                    )}
                    {(selectedTemplate === 'announcement' || selectedTemplate === 'reminder' || selectedTemplate === 'achievement') && (
                      <div className="space-y-2">
                        <label className="text-sm font-medium">Message</label>
                        <Textarea
                          placeholder="Your custom message..."
                          value={emailData.message}
                          onChange={(e) => setEmailData({ ...emailData, message: e.target.value })}
                          rows={3}
                        />
                      </div>
                    )}
                    {selectedTemplate === 'weekly-digest' && (
                      <div className="space-y-2">
                        <label className="text-sm font-medium">Highlights (one per line)</label>
                        <Textarea
                          placeholder="New Physics chapter added&#10;Quiz on Chemistry available&#10;Study reminder: Complete your goals"
                          value={emailData.highlights}
                          onChange={(e) => setEmailData({ ...emailData, highlights: e.target.value })}
                          rows={4}
                        />
                      </div>
                    )}
                    <Separator />
                    <Button 
                      onClick={handleSendEmail} 
                      disabled={sendingEmail || !selectedTemplate || !emailTo.trim()}
                      className="w-full h-11 gap-2"
                    >
                      {sendingEmail ? (
                        <>
                          <Loader2 className="h-4 w-4 animate-spin" />
                          Sending...
                        </>
                      ) : (
                        <>
                          <Send className="h-4 w-4" />
                          Send Email
                        </>
                      )}
                    </Button>
                  </CardContent>
                </Card>
              </div>
            </motion.div>
          </TabsContent>

          {/* Notifications Tab */}
          <TabsContent value="notifications">
            <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }}>
              {/* Subscription Analytics */}
              <div className="mb-6">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="text-lg font-semibold flex items-center gap-2">
                    <BarChart3 className="h-5 w-5 text-primary" />
                    Subscription Analytics
                  </h3>
                  <Button variant="outline" size="sm" onClick={() => refetchStats()} disabled={statsLoading} className="gap-2">
                    <RefreshCw className={`h-4 w-4 ${statsLoading ? 'animate-spin' : ''}`} />
                    Refresh
                  </Button>
                </div>
                
                {statsLoading ? (
                  <div className="flex justify-center py-12">
                    <Loader2 className="h-8 w-8 animate-spin text-primary" />
                  </div>
                ) : subscriptionStats ? (
                  <>
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-4">
                      {[
                        { label: 'Total Active', value: subscriptionStats.total, icon: Bell, color: 'from-primary/20 to-primary/5 border-primary/30', textColor: 'text-primary' },
                        { label: 'Last 24h', value: subscriptionStats.last24h, icon: Users, color: 'from-emerald-500/20 to-emerald-500/5 border-emerald-500/30', textColor: 'text-emerald-600 dark:text-emerald-400' },
                        { label: 'Last 7 Days', value: subscriptionStats.last7d, icon: BarChart3, color: 'from-blue-500/20 to-blue-500/5 border-blue-500/30', textColor: 'text-blue-600 dark:text-blue-400' },
                        { label: 'Last 30 Days', value: subscriptionStats.last30d, icon: Shield, color: 'from-violet-500/20 to-violet-500/5 border-violet-500/30', textColor: 'text-violet-600 dark:text-violet-400' },
                      ].map((stat) => (
                        <Card key={stat.label} className={`bg-gradient-to-br ${stat.color} border transition-all hover:shadow-md`}>
                          <CardContent className="pt-4">
                            <div className="flex items-center justify-between">
                              <div>
                                <p className="text-sm text-muted-foreground">{stat.label}</p>
                                <p className={`text-2xl font-bold ${stat.textColor}`}>{stat.value}</p>
                              </div>
                              <div className="h-10 w-10 rounded-xl bg-background/50 flex items-center justify-center">
                                <stat.icon className={`h-5 w-5 ${stat.textColor}`} />
                              </div>
                            </div>
                          </CardContent>
                        </Card>
                      ))}
                    </div>
                    
                    {subscriptionStats.byBrowser && subscriptionStats.byBrowser.length > 0 && (
                      <Card className="border-2">
                        <CardHeader className="pb-3">
                          <CardTitle className="text-sm font-medium flex items-center gap-2">
                            <Globe className="h-4 w-4 text-primary" />
                            Subscribers by Browser
                          </CardTitle>
                        </CardHeader>
                        <CardContent>
                          <div className="flex flex-wrap gap-2">
                            {subscriptionStats.byBrowser.map(({ browser, count }) => (
                              <Badge key={browser} variant="secondary" className="text-sm py-1.5 px-3">
                                {browser}: {count}
                              </Badge>
                            ))}
                          </div>
                        </CardContent>
                      </Card>
                    )}
                  </>
                ) : (
                  <p className="text-center text-muted-foreground py-8">Failed to load stats</p>
                )}
              </div>

              <Card className="border-2 shadow-lg">
                <CardHeader className="bg-muted/30">
                  <CardTitle className="flex items-center gap-2">
                    <div className="h-8 w-8 bg-primary/10 rounded-lg flex items-center justify-center">
                      <Bell className="h-4 w-4 text-primary" />
                    </div>
                    Send Push Notification
                  </CardTitle>
                  <CardDescription>
                    Send a notification to all students who have enabled push notifications
                  </CardDescription>
                </CardHeader>
                <CardContent className="pt-6 space-y-4">
                  <div className="space-y-2">
                    <label className="text-sm font-medium">Title</label>
                    <Input
                      placeholder="e.g., New Lecture Available! 📚"
                      value={notificationTitle}
                      onChange={(e) => setNotificationTitle(e.target.value)}
                      className="h-11"
                    />
                  </div>
                  <div className="space-y-2">
                    <label className="text-sm font-medium">Message</label>
                    <Textarea
                      placeholder="e.g., Check out the new Physics lecture on Quantum Mechanics"
                      value={notificationBody}
                      onChange={(e) => setNotificationBody(e.target.value)}
                      rows={3}
                    />
                  </div>
                  <div className="space-y-2">
                    <label className="text-sm font-medium">Link (optional)</label>
                    <Input
                      placeholder="e.g., /subject/physics"
                      value={notificationUrl}
                      onChange={(e) => setNotificationUrl(e.target.value)}
                      className="h-11"
                    />
                    <p className="text-xs text-muted-foreground">
                      Where should the notification take users when clicked?
                    </p>
                  </div>
                  <div className="space-y-2">
                    <label className="text-sm font-medium">Image (optional)</label>
                    {notificationImagePreview ? (
                      <div className="relative inline-block">
                        <img 
                          src={notificationImagePreview} 
                          alt="Notification preview" 
                          className="w-full max-w-xs h-auto rounded-xl border-2"
                        />
                        <Button
                          variant="destructive"
                          size="icon"
                          className="absolute top-2 right-2 h-8 w-8"
                          onClick={clearNotificationImage}
                        >
                          <X className="h-4 w-4" />
                        </Button>
                      </div>
                    ) : (
                      <label className="flex flex-col items-center justify-center w-full h-32 border-2 border-dashed rounded-xl cursor-pointer hover:bg-muted/50 transition-colors">
                        <div className="flex flex-col items-center justify-center pt-5 pb-6">
                          <ImagePlus className="w-8 h-8 mb-2 text-muted-foreground" />
                          <p className="text-sm text-muted-foreground">Click to upload image</p>
                          <p className="text-xs text-muted-foreground">PNG, JPG up to 5MB</p>
                        </div>
                        <input 
                          type="file" 
                          className="hidden" 
                          accept="image/*"
                          onChange={handleImageSelect}
                        />
                      </label>
                    )}
                  </div>
                  <div className="flex gap-3 pt-2">
                    <Button 
                      onClick={handleSendNotification} 
                      disabled={sendingNotification || !notificationTitle.trim() || !notificationBody.trim()}
                      className="flex-1 h-11 gap-2"
                    >
                      {sendingNotification ? (
                        <Loader2 className="h-4 w-4 animate-spin" />
                      ) : (
                        <Send className="h-4 w-4" />
                      )}
                      Send to All
                    </Button>
                    <Button 
                      onClick={handleTestPushToDevice} 
                      disabled={sendingTestPush}
                      variant="outline"
                      className="h-11 gap-2"
                    >
                      {sendingTestPush ? (
                        <Loader2 className="h-4 w-4 animate-spin" />
                      ) : (
                        <Smartphone className="h-4 w-4" />
                      )}
                      Test Device
                    </Button>
                  </div>
                </CardContent>
              </Card>

              {/* Quick Templates */}
              <Card className="mt-6 border-2 shadow-lg">
                <CardHeader className="bg-muted/30">
                  <CardTitle className="text-lg flex items-center gap-2">
                    <Sparkles className="h-5 w-5 text-primary" />
                    Quick Templates
                  </CardTitle>
                </CardHeader>
                <CardContent className="pt-4 space-y-3">
                  {[
                    { title: 'New Lecture Available! 📚', body: 'A new lecture has been added. Check it out now!', url: '/', label: 'New Lecture', desc: 'Announce a new lecture' },
                    { title: 'Study Reminder 📖', body: "Don't forget to continue your learning journey today!", url: '/dashboard', label: 'Study Reminder', desc: 'Remind students to study' },
                    { title: 'Important Update! ⚡', body: 'We have some important updates for you.', url: '/', label: 'Important Update', desc: 'General announcement' },
                  ].map((template) => (
                    <Button
                      key={template.label}
                      variant="outline"
                      className="w-full justify-start text-left h-auto py-4 hover:bg-muted/50"
                      onClick={() => {
                        setNotificationTitle(template.title);
                        setNotificationBody(template.body);
                        setNotificationUrl(template.url);
                      }}
                    >
                      <div>
                        <p className="font-semibold">{template.label}</p>
                        <p className="text-xs text-muted-foreground">{template.desc}</p>
                      </div>
                    </Button>
                  ))}
                </CardContent>
              </Card>
            </motion.div>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
};

export default Admin;

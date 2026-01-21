import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Bell, X } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { usePushNotifications } from '@/hooks/usePushNotifications';
import { useToast } from '@/hooks/use-toast';

const PROMPT_DISMISSED_KEY = 'notification_prompt_dismissed';
const PROMPT_DELAY_MS = 3000; // Show after 3 seconds

const NotificationPrompt = () => {
  const [isVisible, setIsVisible] = useState(false);
  const { isSupported, isSubscribed, isLoading, permission, subscribe } = usePushNotifications();
  const { toast } = useToast();

  useEffect(() => {
    // Don't show if:
    // - Not supported
    // - Already subscribed
    // - Permission denied (can't ask again)
    // - User dismissed the prompt before
    if (!isSupported || isSubscribed || permission === 'denied') {
      return;
    }

    const dismissed = localStorage.getItem(PROMPT_DISMISSED_KEY);
    if (dismissed) {
      // Check if dismissed more than 7 days ago - show again
      const dismissedTime = parseInt(dismissed, 10);
      const sevenDaysAgo = Date.now() - (7 * 24 * 60 * 60 * 1000);
      if (dismissedTime > sevenDaysAgo) {
        return;
      }
    }

    // Show prompt after delay
    const timer = setTimeout(() => {
      setIsVisible(true);
    }, PROMPT_DELAY_MS);

    return () => clearTimeout(timer);
  }, [isSupported, isSubscribed, permission]);

  const handleEnable = async () => {
    const success = await subscribe();
    if (success) {
      toast({
        title: 'Notifications Enabled! 🔔',
        description: "You'll now receive updates about new lectures and announcements.",
      });
      setIsVisible(false);
    } else if (permission === 'denied') {
      toast({
        title: 'Permission Denied',
        description: 'Please enable notifications in your browser settings.',
        variant: 'destructive',
      });
    }
  };

  const handleDismiss = () => {
    localStorage.setItem(PROMPT_DISMISSED_KEY, Date.now().toString());
    setIsVisible(false);
  };

  const handleLater = () => {
    setIsVisible(false);
    // Don't save to localStorage - will show again next session
  };

  if (!isVisible) return null;

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0, y: 100 }}
        animate={{ opacity: 1, y: 0 }}
        exit={{ opacity: 0, y: 100 }}
        className="fixed bottom-4 left-4 right-4 z-50 md:left-auto md:right-4 md:max-w-sm"
      >
        <div className="bg-card border-2 border-primary/20 rounded-2xl shadow-2xl overflow-hidden">
          {/* Header with gradient */}
          <div className="bg-gradient-to-r from-primary/20 to-primary/10 px-4 py-3 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <div className="w-10 h-10 rounded-full bg-primary/20 flex items-center justify-center">
                <Bell className="h-5 w-5 text-primary" />
              </div>
              <div>
                <h3 className="font-semibold text-foreground">Stay Updated! 🔔</h3>
                <p className="text-xs text-muted-foreground">Get notified about new lectures</p>
              </div>
            </div>
            <Button
              variant="ghost"
              size="icon"
              className="h-8 w-8 text-muted-foreground hover:text-foreground"
              onClick={handleDismiss}
            >
              <X className="h-4 w-4" />
            </Button>
          </div>

          {/* Content */}
          <div className="p-4">
            <p className="text-sm text-muted-foreground mb-4">
              Enable push notifications to receive instant updates when new lectures are added or important announcements are made.
            </p>

            <div className="flex gap-2">
              <Button
                onClick={handleEnable}
                disabled={isLoading}
                className="flex-1"
              >
                {isLoading ? (
                  <span className="flex items-center gap-2">
                    <span className="h-4 w-4 border-2 border-current border-t-transparent rounded-full animate-spin" />
                    Enabling...
                  </span>
                ) : (
                  <>
                    <Bell className="h-4 w-4 mr-2" />
                    Enable Notifications
                  </>
                )}
              </Button>
              <Button
                variant="outline"
                onClick={handleLater}
                disabled={isLoading}
              >
                Later
              </Button>
            </div>
          </div>
        </div>
      </motion.div>
    </AnimatePresence>
  );
};

export default NotificationPrompt;

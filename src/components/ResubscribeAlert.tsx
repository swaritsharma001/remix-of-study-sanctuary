import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { AlertTriangle, Bell, X } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { usePushNotifications } from '@/hooks/usePushNotifications';
import { useToast } from '@/hooks/use-toast';

const RESUBSCRIBE_DISMISSED_KEY = 'resubscribe_alert_dismissed';

/**
 * This alert shows when:
 * 1. User has previously granted notification permission (meaning they subscribed before)
 * 2. But they're NOT currently subscribed (meaning their subscription was invalidated)
 * 
 * This happens when the service worker is updated and old subscriptions become invalid.
 */
const ResubscribeAlert = () => {
  const [isVisible, setIsVisible] = useState(false);
  const { isSupported, isSubscribed, permission, subscribe, isLoading } = usePushNotifications();
  const { toast } = useToast();

  useEffect(() => {
    // Only show if:
    // 1. Push is supported
    // 2. Permission was previously granted (they subscribed before)
    // 3. They're NOT currently subscribed (subscription was lost)
    // 4. Alert wasn't dismissed
    const wasDismissed = localStorage.getItem(RESUBSCRIBE_DISMISSED_KEY);
    
    if (isSupported && permission === 'granted' && !isSubscribed && !wasDismissed) {
      // Small delay to let the page load
      const timer = setTimeout(() => setIsVisible(true), 1500);
      return () => clearTimeout(timer);
    }
  }, [isSupported, isSubscribed, permission]);

  const handleResubscribe = async () => {
    const success = await subscribe();
    if (success) {
      toast({
        title: "Notifications Restored! 🎉",
        description: "You'll now receive updates again.",
      });
      setIsVisible(false);
    } else {
      toast({
        title: "Something went wrong",
        description: "Please try again later.",
        variant: "destructive",
      });
    }
  };

  const handleDismiss = () => {
    localStorage.setItem(RESUBSCRIBE_DISMISSED_KEY, Date.now().toString());
    setIsVisible(false);
  };

  if (!isVisible) return null;

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        exit={{ opacity: 0, y: -20 }}
        className="fixed top-16 left-0 right-0 z-50 px-4 py-2"
      >
        <div className="max-w-2xl mx-auto bg-amber-500/10 border border-amber-500/30 rounded-lg p-4 backdrop-blur-sm shadow-lg">
          <div className="flex items-start gap-3">
            <div className="flex-shrink-0 p-2 bg-amber-500/20 rounded-full">
              <AlertTriangle className="h-5 w-5 text-amber-500" />
            </div>
            
            <div className="flex-1 min-w-0">
              <h4 className="font-semibold text-foreground text-sm">
                Notification Update Required
              </h4>
              <p className="text-xs text-muted-foreground mt-1">
                Humne notifications ko upgrade kiya hai! Apne notifications wapas pane ke liye please re-enable karein.
              </p>
              
              <div className="flex items-center gap-2 mt-3">
                <Button
                  size="sm"
                  onClick={handleResubscribe}
                  disabled={isLoading}
                  className="bg-amber-500 hover:bg-amber-600 text-white"
                >
                  <Bell className="h-4 w-4 mr-1" />
                  {isLoading ? 'Processing...' : 'Re-enable Notifications'}
                </Button>
                <Button
                  size="sm"
                  variant="ghost"
                  onClick={handleDismiss}
                  className="text-muted-foreground hover:text-foreground"
                >
                  Later
                </Button>
              </div>
            </div>
            
            <button
              onClick={handleDismiss}
              className="flex-shrink-0 p-1 hover:bg-muted rounded-full transition-colors"
            >
              <X className="h-4 w-4 text-muted-foreground" />
            </button>
          </div>
        </div>
      </motion.div>
    </AnimatePresence>
  );
};

export default ResubscribeAlert;

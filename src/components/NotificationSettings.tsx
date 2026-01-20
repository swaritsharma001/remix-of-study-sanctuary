import React from 'react';
import { motion } from 'framer-motion';
import { Bell, BellOff, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { usePushNotifications } from '@/hooks/usePushNotifications';
import { toast } from '@/hooks/use-toast';

const NotificationSettings: React.FC = () => {
  const { isSupported, isSubscribed, isLoading, permission, subscribe, unsubscribe } = usePushNotifications();

  const handleToggle = async () => {
    if (isSubscribed) {
      const success = await unsubscribe();
      if (success) {
        toast({
          title: "Notifications disabled",
          description: "You won't receive push notifications anymore.",
        });
      }
    } else {
      const success = await subscribe();
      if (success) {
        toast({
          title: "Notifications enabled",
          description: "You'll be notified when new lectures are added.",
        });
      } else if (permission === 'denied') {
        toast({
          variant: "destructive",
          title: "Permission denied",
          description: "Please enable notifications in your browser settings.",
        });
      } else {
        toast({
          variant: "destructive",
          title: "Couldn't enable notifications",
          description: "Please refresh and try again (the app may need to load the push key).",
        });
      }
    }
  };

  if (!isSupported) {
    return (
      <div className="rounded-xl bg-muted/50 p-4">
        <p className="text-sm text-muted-foreground">
          Push notifications are not supported in this browser.
        </p>
      </div>
    );
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      className="flex items-center justify-between rounded-xl bg-card p-4 border border-border"
    >
      <div className="flex items-center gap-3">
        <div className={`flex h-10 w-10 items-center justify-center rounded-lg ${
          isSubscribed ? 'bg-primary/10' : 'bg-muted'
        }`}>
          {isSubscribed ? (
            <Bell className="h-5 w-5 text-primary" />
          ) : (
            <BellOff className="h-5 w-5 text-muted-foreground" />
          )}
        </div>
        <div>
          <p className="font-medium">Push Notifications</p>
          <p className="text-sm text-muted-foreground">
            {isSubscribed ? 'Enabled - get alerts for new lectures' : 'Enable to stay updated'}
          </p>
        </div>
      </div>

      <Button
        onClick={handleToggle}
        variant={isSubscribed ? "outline" : "default"}
        size="sm"
        disabled={isLoading}
      >
        {isLoading ? (
          <Loader2 className="h-4 w-4 animate-spin" />
        ) : isSubscribed ? (
          "Disable"
        ) : (
          "Enable"
        )}
      </Button>
    </motion.div>
  );
};

export default NotificationSettings;

import React from 'react';
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Wifi, WifiOff, Cloud, CloudOff, RefreshCw, Download } from "lucide-react";
import { useOfflineQueue } from '@/hooks/useOfflineQueue';
import { motion, AnimatePresence } from 'framer-motion';

const OfflineIndicator = () => {
  const { isOnline, queueLength, syncing, syncQueue, preCacheTranslations } = useOfflineQueue();

  return (
    <div className="fixed bottom-20 left-4 right-4 md:left-auto md:right-4 md:bottom-4 z-50 md:w-auto">
      <AnimatePresence>
        {!isOnline && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 20 }}
            className="bg-warning/90 backdrop-blur-sm text-warning-foreground px-4 py-3 rounded-lg shadow-lg flex items-center gap-3"
          >
            <WifiOff className="w-5 h-5 shrink-0" />
            <div className="flex-1">
              <p className="font-medium text-sm">You're offline</p>
              <p className="text-xs opacity-90">Contributions saved locally</p>
            </div>
            {queueLength > 0 && (
              <Badge variant="secondary" className="shrink-0">
                {queueLength} pending
              </Badge>
            )}
          </motion.div>
        )}

        {isOnline && queueLength > 0 && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 20 }}
            className="bg-primary/90 backdrop-blur-sm text-primary-foreground px-4 py-3 rounded-lg shadow-lg flex items-center gap-3"
          >
            <Cloud className="w-5 h-5 shrink-0" />
            <div className="flex-1">
              <p className="font-medium text-sm">{queueLength} entries to sync</p>
              <p className="text-xs opacity-90">Ready to upload</p>
            </div>
            <Button 
              size="sm" 
              variant="secondary"
              onClick={syncQueue}
              disabled={syncing}
              className="shrink-0"
            >
              {syncing ? (
                <RefreshCw className="w-4 h-4 animate-spin" />
              ) : (
                <>
                  <Cloud className="w-4 h-4 mr-1" />
                  Sync
                </>
              )}
            </Button>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default OfflineIndicator;

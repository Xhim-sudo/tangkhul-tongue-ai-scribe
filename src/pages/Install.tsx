import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { 
  Download, Smartphone, CheckCircle, Share, 
  Plus, MoreVertical, ArrowDown, Wifi, WifiOff,
  Globe, Zap, Bell, Terminal, Code, Package
} from "lucide-react";
import { motion } from 'framer-motion';
import { useOfflineQueue } from '@/hooks/useOfflineQueue';
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

interface BeforeInstallPromptEvent extends Event {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: 'accepted' | 'dismissed' }>;
}

const Install = () => {
  const [deferredPrompt, setDeferredPrompt] = useState<BeforeInstallPromptEvent | null>(null);
  const [isInstalled, setIsInstalled] = useState(false);
  const [isIOS, setIsIOS] = useState(false);
  const { preCacheTranslations, isOnline } = useOfflineQueue();

  useEffect(() => {
    // Check if already installed
    if (window.matchMedia('(display-mode: standalone)').matches) {
      setIsInstalled(true);
    }

    // Check for iOS
    const iOS = /iPad|iPhone|iPod/.test(navigator.userAgent);
    setIsIOS(iOS);

    // Listen for install prompt
    const handleBeforeInstall = (e: Event) => {
      e.preventDefault();
      setDeferredPrompt(e as BeforeInstallPromptEvent);
    };

    window.addEventListener('beforeinstallprompt', handleBeforeInstall);

    return () => {
      window.removeEventListener('beforeinstallprompt', handleBeforeInstall);
    };
  }, []);

  const handleInstall = async () => {
    if (!deferredPrompt) return;

    deferredPrompt.prompt();
    const { outcome } = await deferredPrompt.userChoice;
    
    if (outcome === 'accepted') {
      setIsInstalled(true);
    }
    setDeferredPrompt(null);
  };

  const features = [
    { icon: WifiOff, title: 'Works Offline', desc: 'Translate and contribute without internet' },
    { icon: Zap, title: 'Fast & Light', desc: 'Instant loading, minimal data usage' },
    { icon: Bell, title: 'Notifications', desc: 'Get updates on your contributions' },
    { icon: Globe, title: 'Always Updated', desc: 'Latest features automatically' }
  ];

  return (
    <div className="min-h-screen bg-background p-6">
      <div className="max-w-lg mx-auto space-y-6">
        {/* Header */}
        <motion.div 
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-center space-y-4"
        >
          <div className="w-24 h-24 mx-auto bg-gradient-to-br from-primary to-accent rounded-3xl flex items-center justify-center shadow-glow">
            <span className="text-4xl">🗣️</span>
          </div>
          <h1 className="text-3xl font-bold text-foreground">Tangkhul Translator</h1>
          <p className="text-muted-foreground">Install the app for offline translation</p>
        </motion.div>

        {/* Install Status */}
        {isInstalled ? (
          <Card className="glass border-success/30">
            <CardContent className="p-6 text-center">
              <CheckCircle className="w-12 h-12 text-success mx-auto mb-4" />
              <h2 className="text-xl font-bold text-foreground">App Installed!</h2>
              <p className="text-muted-foreground mt-2">
                You can now use Tangkhul Translator from your home screen
              </p>
              <Button 
                onClick={preCacheTranslations} 
                className="mt-4"
                disabled={!isOnline}
              >
                <Download className="w-4 h-4 mr-2" />
                Download Translations for Offline
              </Button>
            </CardContent>
          </Card>
        ) : (
          <>
            {/* Install Button (Android/Chrome) */}
            {deferredPrompt && (
              <motion.div
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
              >
                <Button 
                  onClick={handleInstall}
                  size="lg"
                  className="w-full h-14 text-lg bg-gradient-to-r from-primary to-accent"
                >
                  <Download className="w-5 h-5 mr-2" />
                  Install App
                </Button>
              </motion.div>
            )}

            {/* iOS Instructions */}
            {isIOS && (
              <Card className="glass border-primary/20">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Smartphone className="w-5 h-5 text-primary" />
                    Install on iPhone/iPad
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="flex items-start gap-4">
                    <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center shrink-0">
                      <Share className="w-4 h-4 text-primary" />
                    </div>
                    <div>
                      <p className="font-medium text-foreground">1. Tap the Share button</p>
                      <p className="text-sm text-muted-foreground">At the bottom of Safari</p>
                    </div>
                  </div>
                  <div className="flex items-start gap-4">
                    <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center shrink-0">
                      <Plus className="w-4 h-4 text-primary" />
                    </div>
                    <div>
                      <p className="font-medium text-foreground">2. Tap "Add to Home Screen"</p>
                      <p className="text-sm text-muted-foreground">Scroll down in the share menu</p>
                    </div>
                  </div>
                  <div className="flex items-start gap-4">
                    <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center shrink-0">
                      <ArrowDown className="w-4 h-4 text-primary" />
                    </div>
                    <div>
                      <p className="font-medium text-foreground">3. Tap "Add"</p>
                      <p className="text-sm text-muted-foreground">The app will appear on your home screen</p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            )}

            {/* Android Chrome Instructions */}
            {!isIOS && !deferredPrompt && (
              <Card className="glass border-primary/20">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Smartphone className="w-5 h-5 text-primary" />
                    Install on Android
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="flex items-start gap-4">
                    <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center shrink-0">
                      <MoreVertical className="w-4 h-4 text-primary" />
                    </div>
                    <div>
                      <p className="font-medium text-foreground">1. Tap the menu button</p>
                      <p className="text-sm text-muted-foreground">Three dots at the top right</p>
                    </div>
                  </div>
                  <div className="flex items-start gap-4">
                    <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center shrink-0">
                      <Download className="w-4 h-4 text-primary" />
                    </div>
                    <div>
                      <p className="font-medium text-foreground">2. Tap "Install app" or "Add to Home screen"</p>
                      <p className="text-sm text-muted-foreground">The option varies by browser</p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            )}
          </>
        )}

        {/* Features */}
        <Card className="glass border-primary/20">
          <CardHeader>
            <CardTitle>Why Install?</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 gap-4">
              {features.map((feature, idx) => (
                <motion.div
                  key={idx}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: idx * 0.1 }}
                  className="p-4 rounded-lg bg-surface/50 border border-border"
                >
                  <feature.icon className="w-6 h-6 text-primary mb-2" />
                  <h3 className="font-medium text-foreground text-sm">{feature.title}</h3>
                  <p className="text-xs text-muted-foreground mt-1">{feature.desc}</p>
                </motion.div>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Back to App */}
        <Button variant="outline" className="w-full" onClick={() => window.history.back()}>
          Back to Translator
        </Button>

        {/* APK Build Instructions */}
        <Card className="glass border-accent/20">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Package className="w-5 h-5 text-accent" />
              Build Native APK (Android)
            </CardTitle>
          </CardHeader>
          <CardContent>
            <Tabs defaultValue="setup" className="w-full">
              <TabsList className="grid w-full grid-cols-2 mb-4">
                <TabsTrigger value="setup" className="text-xs">Setup</TabsTrigger>
                <TabsTrigger value="build" className="text-xs">Build APK</TabsTrigger>
              </TabsList>
              
              <TabsContent value="setup" className="space-y-3 text-sm">
                <p className="text-muted-foreground">Prerequisites: Node.js, Android Studio installed</p>
                
                <div className="space-y-2">
                  <div className="flex items-center gap-2">
                    <Badge variant="outline" className="text-xs">1</Badge>
                    <span>Export to GitHub via Settings</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Badge variant="outline" className="text-xs">2</Badge>
                    <span>Clone and install dependencies</span>
                  </div>
                  <code className="block bg-muted/50 p-2 rounded text-xs overflow-x-auto">
                    git clone [your-repo-url]<br/>
                    cd tangkhul-tongue-ai-scribe<br/>
                    npm install
                  </code>
                  <div className="flex items-center gap-2">
                    <Badge variant="outline" className="text-xs">3</Badge>
                    <span>Add Android platform</span>
                  </div>
                  <code className="block bg-muted/50 p-2 rounded text-xs overflow-x-auto">
                    npx cap add android
                  </code>
                </div>
              </TabsContent>
              
              <TabsContent value="build" className="space-y-3 text-sm">
                <div className="space-y-2">
                  <div className="flex items-center gap-2">
                    <Badge variant="outline" className="text-xs">1</Badge>
                    <span>Build the web app</span>
                  </div>
                  <code className="block bg-muted/50 p-2 rounded text-xs overflow-x-auto">
                    npm run build
                  </code>
                  
                  <div className="flex items-center gap-2">
                    <Badge variant="outline" className="text-xs">2</Badge>
                    <span>Sync to Android</span>
                  </div>
                  <code className="block bg-muted/50 p-2 rounded text-xs overflow-x-auto">
                    npx cap sync android
                  </code>
                  
                  <div className="flex items-center gap-2">
                    <Badge variant="outline" className="text-xs">3</Badge>
                    <span>Open in Android Studio</span>
                  </div>
                  <code className="block bg-muted/50 p-2 rounded text-xs overflow-x-auto">
                    npx cap open android
                  </code>
                  
                  <div className="flex items-center gap-2">
                    <Badge variant="outline" className="text-xs">4</Badge>
                    <span>Build APK from Android Studio</span>
                  </div>
                  <p className="text-xs text-muted-foreground">
                    Build → Build Bundle(s) / APK(s) → Build APK(s)
                  </p>
                </div>
              </TabsContent>
            </Tabs>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default Install;

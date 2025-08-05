import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent } from '@/components/ui/card';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { Link, Copy, Sparkles, Eye, EyeOff, Calendar, Shield } from 'lucide-react';

export function UrlShortener() {
  const [originalUrl, setOriginalUrl] = useState('');
  const [customSlug, setCustomSlug] = useState('');
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [isPrivate, setIsPrivate] = useState(false);
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [expiresAt, setExpiresAt] = useState('');
  const [customExpiry, setCustomExpiry] = useState('');
  const [shortenedUrl, setShortenedUrl] = useState('');
  const [loading, setLoading] = useState(false);
  const { toast } = useToast();
  const { user } = useAuth();

  const generateRandomSlug = () => {
    const chars = 'abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
    let result = '';
    for (let i = 0; i < 6; i++) {
      result += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    return result;
  };

  const handleShorten = async () => {
    if (!originalUrl) {
      toast({
        title: "URL Required",
        description: "Please enter a URL to shorten",
        variant: "destructive",
      });
      return;
    }

    if (!originalUrl.startsWith('http://') && !originalUrl.startsWith('https://')) {
      toast({
        title: "Invalid URL", 
        description: "Please enter a valid URL starting with http:// or https://",
        variant: "destructive",
      });
      return;
    }

    setLoading(true);

    try {
      // Get current session to ensure we have the latest user info
      const { data: { session } } = await supabase.auth.getSession();
      const currentUser = session?.user;

      // Check link limit for anonymous users
      if (!currentUser) {
        const { count } = await supabase
          .from('urls')
          .select('*', { count: 'exact', head: true })
          .is('user_id', null);

        if (count && count >= 5) {
          toast({
            title: "Link Limit Reached",
            description: "Anonymous users can only create 5 links. Please sign in to create more links or delete existing ones.",
            variant: "destructive",
          });
          setLoading(false);
          return;
        }
      }

      console.log('Current user:', currentUser?.id); // Debug log

      const slug = customSlug || generateRandomSlug();
      
      // Check if slug already exists
      const { data: existingUrl } = await supabase
        .from('urls')
        .select('short_slug')
        .eq('short_slug', slug)
        .single();

      if (existingUrl) {
        toast({
          title: "Slug Already Exists",
          description: "Please choose a different custom slug or leave it blank for a random one",
          variant: "destructive",
        });
        setLoading(false);
        return;
      }

      // Calculate expiry date
      let calculatedExpiresAt = null;
      if (expiresAt && expiresAt !== 'never') {
        const now = new Date();
        switch (expiresAt) {
          case '1hour':
            calculatedExpiresAt = new Date(now.getTime() + 60 * 60 * 1000);
            break;
          case '1day':
            calculatedExpiresAt = new Date(now.getTime() + 24 * 60 * 60 * 1000);
            break;
          case '1week':
            calculatedExpiresAt = new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000);
            break;
          case 'custom':
            if (customExpiry) {
              calculatedExpiresAt = new Date(customExpiry);
            }
            break;
        }
      }

      const { data, error } = await supabase
        .from('urls')
        .insert({
          original_url: originalUrl,
          short_slug: slug,
          title: title || null,
          description: description || null,
          is_private: isPrivate,
          password: password || null,
          expires_at: calculatedExpiresAt,
          user_id: currentUser?.id || null,
        })
        .select()
        .single();

      console.log('Insert result:', { data, error }); // Debug log

      if (error) throw error;

      const shortUrl = `${window.location.origin}/${data.short_slug}`;
      setShortenedUrl(shortUrl);
      
      toast({
        title: "URL Shortened! 🎉",
        description: "Your short URL is ready to use",
      });
    } catch (error: any) {
      console.error('Error details:', error); // Debug log
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const copyToClipboard = () => {
    navigator.clipboard.writeText(shortenedUrl);
    toast({
      title: "Copied! 📋",
      description: "Short URL copied to clipboard",
    });
  };

  const reset = () => {
    setOriginalUrl('');
    setCustomSlug('');
    setTitle('');
    setDescription('');
    setIsPrivate(false);
    setPassword('');
    setExpiresAt('');
    setCustomExpiry('');
    setShortenedUrl('');
  };

  return (
    <Card className="w-full max-w-2xl mx-auto bg-gradient-to-br from-card via-card to-muted/20 border-2 border-primary/20 shadow-elegant">
      <CardContent className="p-8">
        <div className="text-center mb-6">
          <div className="flex items-center justify-center gap-2 mb-2">
            <Link className="h-8 w-8 text-primary animate-pulse" />
            <h2 className="text-3xl font-bold bg-gradient-primary bg-clip-text text-transparent">
              Shorten Your URL
            </h2>
            <Sparkles className="h-6 w-6 text-accent animate-bounce" />
          </div>
          <p className="text-muted-foreground">Transform long URLs into cute, memorable links ✨</p>
        </div>

        <div className="space-y-6">
          <div className="grid gap-4">
            <div>
              <Label htmlFor="originalUrl" className="text-sm font-medium">Long URL *</Label>
              <Input
                id="originalUrl"
                type="url"
                placeholder="https://example.com/very/long/url/that/needs/shortening"
                value={originalUrl}
                onChange={(e) => setOriginalUrl(e.target.value)}
                className="transition-all duration-300 focus:shadow-glow"
              />
            </div>

            <div>
              <Label htmlFor="customSlug" className="text-sm font-medium">Custom Slug (optional)</Label>
              <Input
                id="customSlug"
                placeholder="my-custom-slug"
                value={customSlug}
                onChange={(e) => setCustomSlug(e.target.value.replace(/[^a-zA-Z0-9-_]/g, ''))}
                className="transition-all duration-300 focus:shadow-glow"
              />
            </div>

            <div>
              <Label htmlFor="title" className="text-sm font-medium">Title (optional)</Label>
              <Input
                id="title"
                placeholder="My Awesome Link"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                className="transition-all duration-300 focus:shadow-glow"
              />
            </div>

            <div>
              <Label htmlFor="description" className="text-sm font-medium">Description (optional)</Label>
              <Textarea
                id="description"
                placeholder="Brief description of this link..."
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                className="transition-all duration-300 focus:shadow-glow resize-none"
                rows={2}
              />
            </div>
          </div>

          {/* Advanced Options */}
          <Card className="p-4 bg-muted/20 border-accent/30">
            <div className="flex items-center gap-2 mb-4">
              <Shield className="h-4 w-4 text-accent" />
              <h3 className="font-medium text-sm">Advanced Options</h3>
            </div>
            
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <Label htmlFor="isPrivate" className="text-sm">Make Private</Label>
                <Switch
                  id="isPrivate"
                  checked={isPrivate}
                  onCheckedChange={setIsPrivate}
                />
              </div>

              <div>
                <Label htmlFor="password" className="text-sm font-medium">Password Protection (optional)</Label>
                <div className="relative mt-1">
                  <Input
                    id="password"
                    type={showPassword ? "text" : "password"}
                    placeholder="Enter password to protect this link"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className="pr-10"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3 top-1/2 transform -translate-y-1/2 text-muted-foreground hover:text-foreground"
                  >
                    {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                  </button>
                </div>
              </div>

              <div>
                <Label htmlFor="expiresAt" className="text-sm font-medium">Expiration (optional)</Label>
                <Select value={expiresAt} onValueChange={setExpiresAt}>
                  <SelectTrigger className="mt-1">
                    <SelectValue placeholder="Never expires" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="never">Never expires</SelectItem>
                    <SelectItem value="1hour">1 Hour</SelectItem>
                    <SelectItem value="1day">1 Day</SelectItem>
                    <SelectItem value="1week">1 Week</SelectItem>
                    <SelectItem value="custom">Custom Date</SelectItem>
                  </SelectContent>
                </Select>
                
                {expiresAt === 'custom' && (
                  <div className="mt-2">
                    <Input
                      type="datetime-local"
                      value={customExpiry}
                      onChange={(e) => setCustomExpiry(e.target.value)}
                      className="transition-all duration-300 focus:shadow-glow"
                      min={new Date().toISOString().slice(0, 16)}
                    />
                  </div>
                )}
              </div>
            </div>
          </Card>

          <Button 
            onClick={handleShorten}
            disabled={loading || !originalUrl}
            className="w-full bg-gradient-primary hover:opacity-90 transform hover:scale-105 transition-all duration-300"
          >
            {loading ? "Creating Magic... ✨" : "Shorten URL 🔗"}
          </Button>

          {shortenedUrl && (
            <Card className="p-4 bg-gradient-accent border-accent/30">
              <div className="flex items-center gap-2 mb-2">
                <span className="text-sm font-medium text-accent-foreground">Your Short URL:</span>
              </div>
              <div className="flex items-center gap-2">
                <Input
                  value={shortenedUrl}
                  readOnly
                  className="bg-background/50 border-accent/30"
                />
                <Button
                  onClick={copyToClipboard}
                  variant="outline"
                  size="icon"
                  className="border-accent/30 hover:bg-accent/20"
                >
                  <Copy className="h-4 w-4" />
                </Button>
              </div>
              <Button
                onClick={reset}
                variant="ghost"
                size="sm"
                className="mt-3 text-accent-foreground hover:bg-accent/20"
              >
                Create Another 🚀
              </Button>
            </Card>
          )}
        </div>
      </CardContent>
    </Card>
  );
}

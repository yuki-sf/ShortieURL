import { useEffect, useState } from 'react';
import { useParams, Navigate } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Lock, Eye, EyeOff } from 'lucide-react';

export default function Redirect() {
  const { slug } = useParams();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [url, setUrl] = useState<any>(null);
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [redirecting, setRedirecting] = useState(false);

  useEffect(() => {
    if (slug) {
      checkUrl();
    }
  }, [slug]);

  const checkUrl = async () => {
    try {
      // Use the security definer function to get URL regardless of RLS
      const { data, error } = await supabase.rpc('get_url_by_slug', { 
        slug_param: slug 
      });

      if (error || !data || data.length === 0) {
        setError('Short URL not found');
        setLoading(false);
        return;
      }

      const urlData = data[0];

      // Check if expired
      if (urlData.expires_at && new Date(urlData.expires_at) < new Date()) {
        setError('This short URL has expired');
        setLoading(false);
        return;
      }

      setUrl(urlData);
      
      // If no password required, show preview then redirect
      if (!urlData.password || urlData.password.trim() === '') {
        setLoading(false);
        // Auto redirect after 3 seconds to show title/description
        setTimeout(async () => {
          await recordClick(urlData);
          window.location.href = urlData.original_url;
        }, 3000);
        return;
      }

      setLoading(false);
    } catch (err) {
      setError('An error occurred while fetching the URL');
      setLoading(false);
    }
  };

  const recordClick = async (urlData: any) => {
    try {
      // Record the click
      await supabase.from('clicks').insert({
        url_id: urlData.id,
        ip_address: '', // We can't get real IP in frontend
        user_agent: navigator.userAgent,
        referer: document.referrer,
      });

      // Update click count
      await supabase
        .from('urls')
        .update({ clicks: (urlData.clicks || 0) + 1 })
        .eq('id', urlData.id);
    } catch (err) {
      console.error('Error recording click:', err);
    }
  };

  const handlePasswordSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!url) return;

    if (password !== url.password) {
      setError('Incorrect password. Please try again.');
      return;
    }

    setRedirecting(true);
    await recordClick(url);
    window.location.href = url.original_url;
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-subtle">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4"></div>
          <p className="text-muted-foreground">Redirecting...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-subtle px-4">
        <Card className="w-full max-w-md bg-gradient-to-br from-card via-card to-muted/20 border-2 border-primary/20 shadow-elegant">
          <CardContent className="p-8 text-center">
            <div className="mb-4">
              <h1 className="text-xl font-bold text-primary mb-2">ShortieURL</h1>
              <div className="text-6xl mb-4">🔗💔</div>
            </div>
            <h2 className="text-2xl font-bold mb-2">Link Not Found</h2>
            <p className="text-muted-foreground mb-6">{error}</p>
            <Button 
              onClick={() => window.location.href = '/'}
              className="bg-gradient-primary hover:opacity-90"
            >
              Go Home
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  // Show URL preview for non-password protected links
  if (url && (!url.password || url.password.trim() === '')) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-subtle px-4">
        <Card className="w-full max-w-md bg-gradient-to-br from-card via-card to-muted/20 border-2 border-primary/20 shadow-elegant">
          <CardContent className="p-8 text-center">
            <div className="mb-4">
              <h1 className="text-lg font-bold text-primary">ShortieURL</h1>
            </div>
            <div className="mb-6">
              <h2 className="text-2xl font-bold mb-2">
                {url.title || 'Redirecting...'}
              </h2>
              {url.description && (
                <p className="text-muted-foreground mb-4">{url.description}</p>
              )}
              <p className="text-sm text-muted-foreground">
                You will be redirected to:
              </p>
              <p className="text-sm text-primary break-all mt-1">
                {url.original_url}
              </p>
            </div>
            
            <div className="space-y-4">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto"></div>
              <p className="text-sm text-muted-foreground">Redirecting in 3 seconds...</p>
              
              <Button 
                onClick={async () => {
                  await recordClick(url);
                  window.location.href = url.original_url;
                }}
                className="w-full bg-gradient-primary hover:opacity-90"
              >
                Go Now
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (url && url.password && url.password.trim() !== '') {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-subtle px-4">
        <Card className="w-full max-w-md bg-gradient-to-br from-card via-card to-muted/20 border-2 border-primary/20 shadow-elegant">
          <CardContent className="p-8 text-center">
            <div className="mb-4">
              <h1 className="text-lg font-bold text-primary">ShortieURL</h1>
            </div>
            <Lock className="h-12 w-12 text-primary mx-auto mb-4" />
            <h2 className="text-2xl font-bold mb-2">
              {url.title || 'Protected Link'}
            </h2>
            {url.description && (
              <p className="text-muted-foreground mb-4">{url.description}</p>
            )}
            <p className="text-muted-foreground mb-6">
              This link is password protected. Please enter the password to continue.
            </p>
            
            <form onSubmit={handlePasswordSubmit} className="space-y-4">
              <div className="relative">
                <Input
                  type={showPassword ? "text" : "password"}
                  placeholder="Enter password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="pr-10"
                  required
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 transform -translate-y-1/2 text-muted-foreground hover:text-foreground"
                >
                  {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                </button>
              </div>
              
              {error && (
                <p className="text-destructive text-sm">{error}</p>
              )}
              
              <Button 
                type="submit" 
                className="w-full bg-gradient-primary hover:opacity-90"
                disabled={redirecting}
              >
                {redirecting ? "Redirecting..." : "Access Link"}
              </Button>
            </form>
          </CardContent>
        </Card>
      </div>
    );
  }

  return null;
}

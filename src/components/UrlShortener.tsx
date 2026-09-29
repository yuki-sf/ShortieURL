import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import {
  Link,
  Copy,
  Eye,
  EyeOff,
  Calendar,
  Shield,
  ArrowUpRight,
  RotateCcw,
} from 'lucide-react';

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
    const chars =
      'abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';

    let result = '';

    for (let i = 0; i < 6; i++) {
      result += chars.charAt(
        Math.floor(Math.random() * chars.length)
      );
    }

    return result;
  };

  const handleShorten = async () => {
    if (!originalUrl) {
      toast({
        title: 'URL Required',
        description: 'Please enter a URL to shorten',
        variant: 'destructive',
      });

      return;
    }

    if (
      !originalUrl.startsWith('http://') &&
      !originalUrl.startsWith('https://')
    ) {
      toast({
        title: 'Invalid URL',
        description:
          'Please enter a valid URL starting with http:// or https://',
        variant: 'destructive',
      });

      return;
    }

    setLoading(true);

    try {
      // Get current session to ensure we have the latest user info
      const {
        data: { session },
      } = await supabase.auth.getSession();

      const currentUser = session?.user;

      // Check link limit for anonymous users
      if (!currentUser) {
        const { count } = await supabase
          .from('urls')
          .select('*', { count: 'exact', head: true })
          .is('user_id', null);

        if (count && count >= 5) {
          toast({
            title: 'Link Limit Reached',
            description:
              'Anonymous users can only create 5 links. Please sign in to create more links or delete existing ones.',
            variant: 'destructive',
          });

          setLoading(false);
          return;
        }
      }

      const slug = customSlug || generateRandomSlug();

      // Check if slug already exists
      const { data: existingUrl } = await supabase
        .from('urls')
        .select('short_slug')
        .eq('short_slug', slug)
        .single();

      if (existingUrl) {
        toast({
          title: 'Slug Already Exists',
          description:
            'Please choose a different custom slug or leave it blank for a random one',
          variant: 'destructive',
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
            calculatedExpiresAt = new Date(
              now.getTime() + 60 * 60 * 1000
            );
            break;

          case '1day':
            calculatedExpiresAt = new Date(
              now.getTime() + 24 * 60 * 60 * 1000
            );
            break;

          case '1week':
            calculatedExpiresAt = new Date(
              now.getTime() + 7 * 24 * 60 * 60 * 1000
            );
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

      if (error) throw error;

      const shortUrl = `${window.location.origin}/${data.short_slug}`;

      setShortenedUrl(shortUrl);

      toast({
        title: 'URL Shortened',
        description: 'Your short URL is ready to use.',
      });
    } catch (error: any) {
      console.error('Error details:', error);

      toast({
        title: 'Error',
        description: error.message,
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  const copyToClipboard = () => {
    navigator.clipboard.writeText(shortenedUrl);

    toast({
      title: 'Copied',
      description: 'Short URL copied to clipboard.',
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
    <div className="w-full bg-white">

      {/* Header */}
      <div className="border-b border-neutral-200 px-5 py-5 md:px-7 md:py-6">
        <div className="flex items-start justify-between gap-5">

          <div>
            <div className="flex items-center gap-3 mb-2">
              <span className="text-xs font-mono text-neutral-400">
                01
              </span>

              <span className="text-xs uppercase tracking-[0.18em] text-neutral-400">
                Create link
              </span>
            </div>

            <h2 className="text-xl md:text-2xl font-semibold tracking-tight">
              Paste your URL
            </h2>

            <p className="mt-1.5 text-sm text-neutral-500">
              Turn a long URL into a clean, shareable link.
            </p>
          </div>

          <div className="hidden sm:flex h-10 w-10 shrink-0 items-center justify-center border border-neutral-200 text-neutral-400">
            <Link className="h-4 w-4" />
          </div>

        </div>
      </div>

      <div className="p-5 md:p-7">

        {/* Main fields */}
        <div className="space-y-5">

          {/* Original URL */}
          <div>
            <Label
              htmlFor="originalUrl"
              className="block text-xs uppercase tracking-[0.15em] font-medium text-neutral-500 mb-2"
            >
              Long URL <span className="text-neutral-900">*</span>
            </Label>

            <Input
              id="originalUrl"
              type="url"
              placeholder="https://example.com/very/long/url"
              value={originalUrl}
              onChange={(e) => setOriginalUrl(e.target.value)}
              className="
                h-12
                rounded-none
                border-neutral-300
                bg-[#fafafa]
                px-4
                text-sm
                shadow-none
                placeholder:text-neutral-400
                focus-visible:ring-0
                focus-visible:border-neutral-900
              "
            />
          </div>

          {/* Slug */}
          <div>
            <div className="flex items-center justify-between mb-2">
              <Label
                htmlFor="customSlug"
                className="block text-xs uppercase tracking-[0.15em] font-medium text-neutral-500"
              >
                Custom slug
              </Label>

              <span className="text-[11px] text-neutral-400">
                Optional
              </span>
            </div>

            <div className="flex">

              <div className="h-12 flex items-center px-3 border border-r-0 border-neutral-300 bg-neutral-100 text-xs text-neutral-400 font-mono">
                /
              </div>

              <Input
                id="customSlug"
                placeholder="my-link"
                value={customSlug}
                onChange={(e) =>
                  setCustomSlug(
                    e.target.value.replace(
                      /[^a-zA-Z0-9-_]/g,
                      ''
                    )
                  )
                }
                className="
                  h-12
                  rounded-none
                  border-neutral-300
                  bg-[#fafafa]
                  px-4
                  text-sm
                  shadow-none
                  placeholder:text-neutral-400
                  focus-visible:ring-0
                  focus-visible:border-neutral-900
                "
              />

            </div>
          </div>

          {/* Metadata */}
          <div className="grid md:grid-cols-2 gap-5">

            <div>
              <div className="flex items-center justify-between mb-2">
                <Label
                  htmlFor="title"
                  className="block text-xs uppercase tracking-[0.15em] font-medium text-neutral-500"
                >
                  Title
                </Label>

                <span className="text-[11px] text-neutral-400">
                  Optional
                </span>
              </div>

              <Input
                id="title"
                placeholder="My awesome link"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                className="
                  h-11
                  rounded-none
                  border-neutral-300
                  bg-[#fafafa]
                  px-4
                  text-sm
                  shadow-none
                  placeholder:text-neutral-400
                  focus-visible:ring-0
                  focus-visible:border-neutral-900
                "
              />
            </div>

            <div>
              <div className="flex items-center justify-between mb-2">
                <Label
                  htmlFor="description"
                  className="block text-xs uppercase tracking-[0.15em] font-medium text-neutral-500"
                >
                  Description
                </Label>

                <span className="text-[11px] text-neutral-400">
                  Optional
                </span>
              </div>

              <Textarea
                id="description"
                placeholder="A short description..."
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                className="
                  min-h-[44px]
                  h-11
                  rounded-none
                  border-neutral-300
                  bg-[#fafafa]
                  px-4
                  py-3
                  text-sm
                  shadow-none
                  placeholder:text-neutral-400
                  focus-visible:ring-0
                  focus-visible:border-neutral-900
                  resize-none
                "
                rows={1}
              />
            </div>

          </div>
        </div>

        {/* Advanced options */}
        <div className="mt-7 border border-neutral-200">

          {/* Advanced header */}
          <div className="flex items-center justify-between px-4 py-4 border-b border-neutral-200 bg-neutral-50">

            <div className="flex items-center gap-3">
              <span className="text-xs font-mono text-neutral-400">
                02
              </span>

              <div>
                <div className="flex items-center gap-2">
                  <Shield className="h-4 w-4 text-neutral-500" />

                  <h3 className="text-sm font-medium">
                    Advanced options
                  </h3>
                </div>

                <p className="text-xs text-neutral-400 mt-0.5">
                  Privacy and expiration controls
                </p>
              </div>
            </div>

          </div>

          <div className="p-4 md:p-5 space-y-5">

            {/* Private */}
            <div className="flex items-center justify-between gap-5">

              <div>
                <Label
                  htmlFor="isPrivate"
                  className="text-sm font-medium"
                >
                  Private link
                </Label>

                <p className="text-xs text-neutral-400 mt-1">
                  Restrict access to this link.
                </p>
              </div>

              <Switch
                id="isPrivate"
                checked={isPrivate}
                onCheckedChange={setIsPrivate}
              />

            </div>

            {/* Password */}
            <div>
              <div className="flex items-center justify-between mb-2">
                <Label
                  htmlFor="password"
                  className="text-xs uppercase tracking-[0.15em] font-medium text-neutral-500"
                >
                  Password protection
                </Label>

                <span className="text-[11px] text-neutral-400">
                  Optional
                </span>
              </div>

              <div className="relative">

                <Input
                  id="password"
                  type={showPassword ? 'text' : 'password'}
                  placeholder="Enter a password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="
                    h-11
                    rounded-none
                    border-neutral-300
                    bg-[#fafafa]
                    px-4
                    pr-11
                    text-sm
                    shadow-none
                    placeholder:text-neutral-400
                    focus-visible:ring-0
                    focus-visible:border-neutral-900
                  "
                />

                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="
                    absolute
                    right-3
                    top-1/2
                    -translate-y-1/2
                    text-neutral-400
                    hover:text-neutral-900
                    transition-colors
                  "
                  aria-label={
                    showPassword
                      ? 'Hide password'
                      : 'Show password'
                  }
                >
                  {showPassword ? (
                    <EyeOff className="h-4 w-4" />
                  ) : (
                    <Eye className="h-4 w-4" />
                  )}
                </button>

              </div>
            </div>

            {/* Expiration */}
            <div>
              <div className="flex items-center gap-2 mb-2">
                <Calendar className="h-3.5 w-3.5 text-neutral-400" />

                <Label
                  htmlFor="expiresAt"
                  className="text-xs uppercase tracking-[0.15em] font-medium text-neutral-500"
                >
                  Expiration
                </Label>

                <span className="text-[11px] text-neutral-400 ml-auto">
                  Optional
                </span>
              </div>

              <Select
                value={expiresAt}
                onValueChange={setExpiresAt}
              >
                <SelectTrigger
                  className="
                    h-11
                    rounded-none
                    border-neutral-300
                    bg-[#fafafa]
                    shadow-none
                    focus:ring-0
                  "
                >
                  <SelectValue placeholder="Never expires" />
                </SelectTrigger>

                <SelectContent className="rounded-none">
                  <SelectItem value="never">
                    Never expires
                  </SelectItem>

                  <SelectItem value="1hour">
                    1 hour
                  </SelectItem>

                  <SelectItem value="1day">
                    1 day
                  </SelectItem>

                  <SelectItem value="1week">
                    1 week
                  </SelectItem>

                  <SelectItem value="custom">
                    Custom date
                  </SelectItem>
                </SelectContent>
              </Select>

              {expiresAt === 'custom' && (
                <Input
                  type="datetime-local"
                  value={customExpiry}
                  onChange={(e) =>
                    setCustomExpiry(e.target.value)
                  }
                  min={new Date()
                    .toISOString()
                    .slice(0, 16)}
                  className="
                    mt-2
                    h-11
                    rounded-none
                    border-neutral-300
                    bg-[#fafafa]
                    shadow-none
                    focus-visible:ring-0
                    focus-visible:border-neutral-900
                  "
                />
              )}
            </div>

          </div>
        </div>

        {/* Submit */}
        <div className="mt-6">

          <Button
            onClick={handleShorten}
            disabled={loading || !originalUrl}
            className="
              w-full
              h-12
              rounded-none
              bg-[#171717]
              text-white
              hover:bg-neutral-800
              disabled:opacity-40
              disabled:hover:bg-[#171717]
              transition-colors
            "
          >
            {loading ? (
              <>
                <span className="h-4 w-4 mr-2 border-2 border-neutral-500 border-t-white rounded-full animate-spin" />
                Creating link
              </>
            ) : (
              <>
                Shorten URL
                <ArrowUpRight className="h-4 w-4 ml-2" />
              </>
            )}
          </Button>

        </div>

        {/* Result */}
        {shortenedUrl && (
          <div className="mt-6 border border-neutral-900 bg-[#171717] text-white">

            <div className="px-5 py-4 border-b border-neutral-700">

              <div className="flex items-center justify-between gap-4">
                <div>
                  <div className="text-xs uppercase tracking-[0.15em] text-neutral-500 mb-1">
                    03 / Ready
                  </div>

                  <h3 className="text-sm font-medium">
                    Your short URL
                  </h3>
                </div>

                <Link className="h-4 w-4 text-neutral-500" />
              </div>

            </div>

            <div className="p-5">

              <div className="flex flex-col sm:flex-row gap-2">

                <Input
                  value={shortenedUrl}
                  readOnly
                  className="
                    h-11
                    rounded-none
                    border-neutral-700
                    bg-neutral-900
                    text-white
                    shadow-none
                    focus-visible:ring-0
                    focus-visible:border-neutral-500
                  "
                />

                <Button
                  onClick={copyToClipboard}
                  className="
                    h-11
                    rounded-none
                    bg-white
                    text-[#171717]
                    hover:bg-neutral-200
                    shrink-0
                  "
                >
                  <Copy className="h-4 w-4 mr-2" />
                  Copy
                </Button>

              </div>

              <button
                onClick={reset}
                className="
                  mt-4
                  flex
                  items-center
                  gap-2
                  text-xs
                  text-neutral-500
                  hover:text-white
                  transition-colors
                "
              >
                <RotateCcw className="h-3.5 w-3.5" />
                Create another link
              </button>

            </div>
          </div>
        )}

      </div>

      {/* Footer strip */}
      <div className="border-t border-neutral-200 px-5 py-4 md:px-7">
        <div className="flex flex-wrap items-center justify-between gap-3">

          <div className="flex items-center gap-2 text-xs text-neutral-400">
            <span className="h-1.5 w-1.5 bg-neutral-300" />
            {user
              ? 'Signed in — links are saved to your account'
              : 'Guest mode — up to 5 anonymous links'}
          </div>

          <span className="text-[11px] uppercase tracking-wider text-neutral-300">
            Shortie
          </span>

        </div>
      </div>

    </div>
  );
}

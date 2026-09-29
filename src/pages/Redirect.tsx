import { useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import {
  Lock,
  Eye,
  EyeOff,
  ArrowUpRight,
  Link as LinkIcon,
  AlertTriangle,
} from 'lucide-react';

export default function Redirect() {
  const { slug } = useParams();

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [url, setUrl] = useState<any>(null);
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [redirecting, setRedirecting] = useState(false);

  // Actual countdown state
  const [countdown, setCountdown] = useState(5);

  useEffect(() => {
    if (slug) {
      checkUrl();
    }
  }, [slug]);

  /**
   * Check the short URL.
   *
   * We intentionally don't start the redirect timer here.
   * The countdown is handled by its own effect once `url`
   * has successfully loaded.
   */
  const checkUrl = async () => {
    try {
      const { data, error } = await supabase.rpc('get_url_by_slug', {
        slug_param: slug,
      });

      if (error || !data || data.length === 0) {
        setError('Short URL not found');
        setLoading(false);
        return;
      }

      const urlData = data[0];

      if (
        urlData.expires_at &&
        new Date(urlData.expires_at) < new Date()
      ) {
        setError('This short URL has expired');
        setLoading(false);
        return;
      }

      setUrl(urlData);
      setCountdown(5);
      setLoading(false);
    } catch (err) {
      setError('An error occurred while fetching the URL');
      setLoading(false);
    }
  };

  /**
   * Start the real countdown for public links.
   *
   * This replaces the old hardcoded setTimeout.
   */
  useEffect(() => {
    if (
      !url ||
      (url.password && url.password.trim() !== '') ||
      redirecting
    ) {
      return;
    }

    setCountdown(5);

    const interval = window.setInterval(() => {
      setCountdown((current) => {
        if (current <= 1) {
          window.clearInterval(interval);
          return 0;
        }

        return current - 1;
      });
    }, 1000);

    return () => {
      window.clearInterval(interval);
    };
  }, [url]);

  /**
   * Redirect automatically when countdown reaches zero.
   */
  useEffect(() => {
    if (
      !url ||
      (url.password && url.password.trim() !== '') ||
      countdown !== 0 ||
      redirecting
    ) {
      return;
    }

    redirectToUrl(url);
  }, [countdown, url, redirecting]);

  /**
   * Record the click before leaving Shortie.
   */
  const recordClick = async (urlData: any) => {
    try {
      const { error: clickError } = await supabase
        .from('clicks')
        .insert({
          url_id: urlData.id,
          ip_address: '',
          user_agent: navigator.userAgent,
          referer: document.referrer,
        });

      if (clickError) {
        console.error('Error recording click:', clickError);
      }

      const { error: incrementError } = await supabase.rpc(
        'increment_url_clicks',
        {
          url_id: urlData.id,
        }
      );

      if (incrementError) {
        console.error(
          'Error incrementing click count:',
          incrementError
        );

        await supabase
          .from('urls')
          .update({
            clicks: (urlData.clicks || 0) + 1,
            updated_at: new Date().toISOString(),
          })
          .eq('id', urlData.id);
      }
    } catch (err) {
      console.error('Error recording click:', err);
    }
  };

  /**
   * Single redirect path.
   *
   * Both the countdown and "Go now" button use this,
   * preventing duplicate click tracking / redirects.
   */
  const redirectToUrl = async (urlData: any) => {
    if (redirecting) return;

    setRedirecting(true);

    await recordClick(urlData);

    window.location.href = urlData.original_url;
  };

  const handlePasswordSubmit = async (
    e: React.FormEvent
  ) => {
    e.preventDefault();

    if (!url || redirecting) return;

    if (password !== url.password) {
      setError('Incorrect password. Please try again.');
      setPassword('');
      return;
    }

    await redirectToUrl(url);
  };

  const goHome = () => {
    window.location.href = '/';
  };

  /* ---------------- Loading ---------------- */

  if (loading) {
    return (
      <div className="relative min-h-screen overflow-hidden bg-[#f7f7f5] text-[#171717]">
        <div
          className="pointer-events-none absolute inset-0 opacity-[0.035]"
          style={{
            backgroundImage:
              'linear-gradient(#171717 1px, transparent 1px), linear-gradient(90deg, #171717 1px, transparent 1px)',
            backgroundSize: '32px 32px',
          }}
        />

        <header className="relative border-b border-black px-5 py-4 sm:px-8">
          <div className="mx-auto flex max-w-6xl items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="flex h-8 w-8 items-center justify-center bg-black text-white">
                <LinkIcon className="h-4 w-4" />
              </div>

              <span className="text-lg font-black tracking-tight">
                Shortie
              </span>
            </div>

            <span className="font-mono text-xs text-muted-foreground">
              /{slug}
            </span>
          </div>
        </header>

        <main className="relative flex min-h-[calc(100vh-65px)] items-center justify-center px-5 py-12">
          <div className="w-full max-w-xl border border-black bg-white shadow-[8px_8px_0_#171717]">
            <div className="border-b border-black px-6 py-4">
              <p className="text-[10px] font-bold uppercase tracking-[0.25em] text-muted-foreground">
                Checking destination
              </p>
            </div>

            <div className="px-6 py-12 text-center">
              <div className="mx-auto mb-6 h-8 w-8 animate-spin border-2 border-black border-t-transparent" />

              <h1 className="text-2xl font-black tracking-tight">
                Loading link
              </h1>

              <p className="mt-2 text-sm text-muted-foreground">
                Checking the destination before redirecting.
              </p>
            </div>
          </div>
        </main>
      </div>
    );
  }

  /* ---------------- Error ---------------- */

  if (error) {
    return (
      <div className="relative min-h-screen overflow-hidden bg-[#f7f7f5] text-[#171717]">
        <div
          className="pointer-events-none absolute inset-0 opacity-[0.035]"
          style={{
            backgroundImage:
              'linear-gradient(#171717 1px, transparent 1px), linear-gradient(90deg, #171717 1px, transparent 1px)',
            backgroundSize: '32px 32px',
          }}
        />

        <header className="relative border-b border-black px-5 py-4 sm:px-8">
          <div className="mx-auto flex max-w-6xl items-center justify-between">
            <button
              onClick={goHome}
              className="flex items-center gap-3"
            >
              <div className="flex h-8 w-8 items-center justify-center bg-black text-white">
                <LinkIcon className="h-4 w-4" />
              </div>

              <span className="text-lg font-black tracking-tight">
                Shortie
              </span>
            </button>

            <span className="font-mono text-xs text-muted-foreground">
              ERROR
            </span>
          </div>
        </header>

        <main className="relative flex min-h-[calc(100vh-65px)] items-center justify-center px-5 py-12">
          <div className="w-full max-w-xl border border-black bg-white shadow-[8px_8px_0_#171717]">
            <div className="border-b border-black bg-black px-6 py-3 text-white">
              <p className="text-[10px] font-bold uppercase tracking-[0.25em]">
                404 / LINK ERROR
              </p>
            </div>

            <div className="px-6 py-10 sm:px-10">
              <div className="mb-7 flex h-12 w-12 items-center justify-center border border-black">
                <AlertTriangle className="h-5 w-5" />
              </div>

              <h1 className="text-3xl font-black tracking-tight sm:text-4xl">
                Link unavailable.
              </h1>

              <p className="mt-3 max-w-md text-sm leading-6 text-muted-foreground">
                {error}
              </p>

              <div className="mt-8 border border-black bg-[#f1f1ee] p-4">
                <p className="mb-1 text-[10px] uppercase tracking-wider text-muted-foreground">
                  Requested path
                </p>

                <code className="font-mono text-sm">
                  /{slug}
                </code>
              </div>

              <Button
                onClick={goHome}
                className="mt-6 h-11 w-full rounded-none bg-black text-white hover:bg-black/90 sm:w-auto sm:px-8"
              >
                Back to Shortie
              </Button>
            </div>
          </div>
        </main>
      </div>
    );
  }

  /* ---------------- Public link ---------------- */

  if (
    url &&
    (!url.password || url.password.trim() === '')
  ) {
    return (
      <div className="relative min-h-screen overflow-hidden bg-[#f7f7f5] text-[#171717]">
        <div
          className="pointer-events-none absolute inset-0 opacity-[0.035]"
          style={{
            backgroundImage:
              'linear-gradient(#171717 1px, transparent 1px), linear-gradient(90deg, #171717 1px, transparent 1px)',
            backgroundSize: '32px 32px',
          }}
        />

        <header className="relative border-b border-black px-5 py-4 sm:px-8">
          <div className="mx-auto flex max-w-6xl items-center justify-between">
            <button
              onClick={goHome}
              className="flex items-center gap-3"
            >
              <div className="flex h-8 w-8 items-center justify-center bg-black text-white">
                <LinkIcon className="h-4 w-4" />
              </div>

              <span className="text-lg font-black tracking-tight">
                Shortie
              </span>
            </button>

            <span className="font-mono text-xs text-muted-foreground">
              /{url.short_slug}
            </span>
          </div>
        </header>

        <main className="relative flex min-h-[calc(100vh-65px)] items-center justify-center px-5 py-12">
          <div className="w-full max-w-2xl border border-black bg-white shadow-[8px_8px_0_#171717]">
            <div className="border-b border-black px-6 py-4 sm:px-8">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-[10px] font-bold uppercase tracking-[0.25em] text-muted-foreground">
                    01 / DESTINATION
                  </p>

                  <p className="mt-1 font-mono text-sm">
                    /{url.short_slug}
                  </p>
                </div>

                <ArrowUpRight className="h-5 w-5" />
              </div>
            </div>

            <div className="px-6 py-10 sm:px-8">
              <h1 className="max-w-xl text-3xl font-black tracking-tight sm:text-4xl">
                {url.title || 'You are leaving Shortie.'}
              </h1>

              {url.description && (
                <p className="mt-4 max-w-xl text-sm leading-6 text-muted-foreground">
                  {url.description}
                </p>
              )}

              <div className="mt-8 border border-black bg-[#f1f1ee] p-4">
                <p className="mb-2 text-[10px] uppercase tracking-wider text-muted-foreground">
                  Destination
                </p>

                <p className="break-all font-mono text-xs leading-5 sm:text-sm">
                  {url.original_url}
                </p>
              </div>

              <div className="mt-8 border-t border-black pt-6">
                <div className="flex flex-col gap-5 sm:flex-row sm:items-center sm:justify-between">
                  <div>
                    <p className="text-2xl font-black">
                      {redirecting
                        ? 'Leaving...'
                        : `${countdown} sec`}
                    </p>

                    <p className="mt-1 text-xs text-muted-foreground">
                      {redirecting
                        ? 'Opening destination'
                        : 'Redirecting automatically'}
                    </p>
                  </div>

                  <Button
                    onClick={() => redirectToUrl(url)}
                    disabled={redirecting}
                    className="h-11 rounded-none bg-black px-7 text-white hover:bg-black/90"
                  >
                    {redirecting
                      ? 'Redirecting...'
                      : 'Go now'}

                    {!redirecting && (
                      <ArrowUpRight className="ml-2 h-4 w-4" />
                    )}
                  </Button>
                </div>

                {/* Actual countdown progress */}
                {!redirecting && (
                  <div className="mt-6 h-1 w-full bg-[#e5e5e2]">
                    <div
                      className="h-full bg-black transition-all duration-1000 ease-linear"
                      style={{
                        width: `${(countdown / 5) * 100}%`,
                      }}
                    />
                  </div>
                )}
              </div>
            </div>
          </div>
        </main>
      </div>
    );
  }

  /* ---------------- Password protected link ---------------- */

  if (
    url &&
    url.password &&
    url.password.trim() !== ''
  ) {
    return (
      <div className="relative min-h-screen overflow-hidden bg-[#f7f7f5] text-[#171717]">
        <div
          className="pointer-events-none absolute inset-0 opacity-[0.035]"
          style={{
            backgroundImage:
              'linear-gradient(#171717 1px, transparent 1px), linear-gradient(90deg, #171717 1px, transparent 1px)',
            backgroundSize: '32px 32px',
          }}
        />

        <header className="relative border-b border-black px-5 py-4 sm:px-8">
          <div className="mx-auto flex max-w-6xl items-center justify-between">
            <button
              onClick={goHome}
              className="flex items-center gap-3"
            >
              <div className="flex h-8 w-8 items-center justify-center bg-black text-white">
                <LinkIcon className="h-4 w-4" />
              </div>

              <span className="text-lg font-black tracking-tight">
                Shortie
              </span>
            </button>

            <span className="font-mono text-xs text-muted-foreground">
              /{url.short_slug}
            </span>
          </div>
        </header>

        <main className="relative flex min-h-[calc(100vh-65px)] items-center justify-center px-5 py-12">
          <div className="w-full max-w-xl border border-black bg-white shadow-[8px_8px_0_#171717]">
            <div className="border-b border-black bg-black px-6 py-3 text-white">
              <p className="text-[10px] font-bold uppercase tracking-[0.25em]">
                01 / PROTECTED LINK
              </p>
            </div>

            <div className="px-6 py-10 sm:px-10">
              <div className="mb-7 flex h-12 w-12 items-center justify-center border border-black">
                <Lock className="h-5 w-5" />
              </div>

              <h1 className="text-3xl font-black tracking-tight sm:text-4xl">
                {url.title || 'Protected link.'}
              </h1>

              {url.description && (
                <p className="mt-4 text-sm leading-6 text-muted-foreground">
                  {url.description}
                </p>
              )}

              <p className="mt-6 text-sm text-muted-foreground">
                This destination requires a password before you can continue.
              </p>

              <form
                onSubmit={handlePasswordSubmit}
                className="mt-7 space-y-4"
              >
                <div className="relative">
                  <Input
                    type={showPassword ? 'text' : 'password'}
                    placeholder="Enter password"
                    value={password}
                    onChange={(e) =>
                      setPassword(e.target.value)
                    }
                    className="h-12 rounded-none border-black bg-[#f7f7f5] pr-11 focus-visible:ring-0 focus-visible:ring-offset-0"
                    required
                  />

                  <button
                    type="button"
                    onClick={() =>
                      setShowPassword(!showPassword)
                    }
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-black"
                  >
                    {showPassword ? (
                      <EyeOff className="h-4 w-4" />
                    ) : (
                      <Eye className="h-4 w-4" />
                    )}
                  </button>
                </div>

                {error && (
                  <div className="border-l-2 border-black bg-[#f1f1ee] px-4 py-3">
                    <p className="text-sm font-medium">
                      {error}
                    </p>

                    <p className="mt-1 text-xs text-muted-foreground">
                      Please enter the correct password to access this link.
                    </p>
                  </div>
                )}

                <Button
                  type="submit"
                  className="h-12 w-full rounded-none bg-black text-white hover:bg-black/90"
                  disabled={redirecting}
                >
                  {redirecting
                    ? 'Redirecting...'
                    : 'Access link'}

                  {!redirecting && (
                    <ArrowUpRight className="ml-2 h-4 w-4" />
                  )}
                </Button>
              </form>
            </div>
          </div>
        </main>
      </div>
    );
  }

  return null;
}

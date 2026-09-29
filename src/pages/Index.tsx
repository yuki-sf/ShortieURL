import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { UrlShortener } from '@/components/UrlShortener';
import { UserLinks } from '@/components/UserLinks';
import { useAuth } from '@/hooks/useAuth';
import {
  Link as LinkIcon,
  User,
  LogOut,
  ArrowUpRight,
  Zap,
  Shield,
  BarChart3,
} from 'lucide-react';

const Index = () => {
  const { user, signOut, loading } = useAuth();
  const navigate = useNavigate();

  const handleSignOut = async () => {
    await signOut();
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-[#f7f7f5] flex items-center justify-center">
        <div className="flex items-center gap-3 text-sm text-neutral-500">
          <div className="h-4 w-4 border-2 border-neutral-300 border-t-neutral-900 rounded-full animate-spin" />
          Loading...
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#f7f7f5] text-[#171717]">
      {/* Header */}
      <header className="sticky top-0 z-50 border-b border-neutral-200 bg-[#f7f7f5]/90 backdrop-blur-md">
        <div className="max-w-6xl mx-auto px-5 md:px-8 h-16 flex items-center justify-between">

          {/* Logo */}
          <button
            onClick={() => navigate('/')}
            className="flex items-center gap-2.5 group"
          >
            <div className="h-8 w-8 bg-[#171717] text-white flex items-center justify-center transition-transform group-hover:-rotate-6">
              <LinkIcon className="h-4 w-4" />
            </div>

            <span className="font-semibold tracking-tight text-lg">
              Shortie
            </span>
          </button>

          {/* Navigation */}
          <div className="flex items-center gap-3">
            {user ? (
              <>
                <span className="hidden sm:block text-sm text-neutral-500">
                  {user.email?.split('@')[0]}
                </span>

                <Button
                  onClick={handleSignOut}
                  variant="ghost"
                  size="sm"
                  className="text-neutral-600 hover:text-neutral-900 hover:bg-neutral-200/70 rounded-none"
                >
                  <LogOut className="h-4 w-4 mr-2" />
                  Sign out
                </Button>
              </>
            ) : (
              <Button
                onClick={() => navigate('/auth')}
                variant="outline"
                size="sm"
                className="rounded-none border-neutral-300 bg-transparent hover:bg-neutral-900 hover:text-white transition-colors"
              >
                <User className="h-4 w-4 mr-2" />
                Sign in
              </Button>
            )}
          </div>
        </div>
      </header>

      {/* Hero */}
      <main>
        <section className="relative overflow-hidden border-b border-neutral-200">

          {/* Decorative grid */}
          <div
            className="absolute inset-0 opacity-[0.035]"
            style={{
              backgroundImage:
                'linear-gradient(#171717 1px, transparent 1px), linear-gradient(90deg, #171717 1px, transparent 1px)',
              backgroundSize: '48px 48px',
            }}
          />

          <div className="relative max-w-6xl mx-auto px-5 md:px-8 pt-20 md:pt-28 pb-24">

            {/* Small label */}
            <div className="flex items-center gap-3 mb-8">
              <span className="h-px w-8 bg-[#171717]" />
              <span className="text-xs uppercase tracking-[0.2em] font-medium text-neutral-500">
                URL Shortener
              </span>
            </div>

            {/* Heading */}
            <div className="max-w-4xl">
              <h1 className="text-5xl sm:text-6xl md:text-8xl font-semibold tracking-[-0.055em] leading-[0.9]">
                Short links.
                <br />
                <span className="text-neutral-400">
                  Nothing else.
                </span>
              </h1>

              <div className="mt-8 flex flex-col md:flex-row md:items-end justify-between gap-8">
                <p className="max-w-xl text-base md:text-lg leading-relaxed text-neutral-500">
                  Turn long URLs into clean, memorable links.
                  Keep them simple, share them anywhere, and track
                  what happens after the click.
                </p>

                <div className="hidden md:flex items-center gap-2 text-sm text-neutral-400">
                  <span>Built for the web</span>
                  <ArrowUpRight className="h-4 w-4" />
                </div>
              </div>
            </div>

            {/* Shortener */}
            <div className="mt-14 md:mt-16">
              <div className="border border-neutral-300 bg-white p-1 shadow-[8px_8px_0_#171717]">
                <UrlShortener />
              </div>
            </div>

            {/* Tiny supporting text */}
            <div className="mt-5 flex flex-wrap items-center gap-x-6 gap-y-2 text-xs text-neutral-400 uppercase tracking-wider">
              <span>Fast redirects</span>
              <span>•</span>
              <span>Custom slugs</span>
              <span>•</span>
              <span>Click analytics</span>
            </div>
          </div>
        </section>

        {/* Logged-in links */}
        {user && (
          <section className="max-w-6xl mx-auto px-5 md:px-8 py-16">
            <div className="flex items-center justify-between mb-8">
              <div>
                <p className="text-xs uppercase tracking-[0.2em] text-neutral-400 mb-2">
                  Dashboard
                </p>
                <h2 className="text-2xl font-semibold tracking-tight">
                  Your links
                </h2>
              </div>
            </div>

            <UserLinks />
          </section>
        )}

        {/* Features */}
        <section className="border-t border-neutral-200">
          <div className="max-w-6xl mx-auto px-5 md:px-8 py-20">

            <div className="grid md:grid-cols-3 border-l border-t border-neutral-200">

              {/* Feature 1 */}
              <div className="border-r border-b border-neutral-200 p-7 md:p-8">
                <div className="flex items-start justify-between mb-14">
                  <span className="text-xs text-neutral-400 font-mono">
                    01
                  </span>

                  <Zap className="h-5 w-5 text-neutral-400" />
                </div>

                <h3 className="text-lg font-semibold mb-3">
                  Fast by default
                </h3>

                <p className="text-sm leading-relaxed text-neutral-500">
                  Short URLs should stay out of your way.
                  Create them quickly and get straight to sharing.
                </p>
              </div>

              {/* Feature 2 */}
              <div className="border-r border-b border-neutral-200 p-7 md:p-8">
                <div className="flex items-start justify-between mb-14">
                  <span className="text-xs text-neutral-400 font-mono">
                    02
                  </span>

                  <BarChart3 className="h-5 w-5 text-neutral-400" />
                </div>

                <h3 className="text-lg font-semibold mb-3">
                  Know your clicks
                </h3>

                <p className="text-sm leading-relaxed text-neutral-500">
                  Keep an eye on how your links perform without
                  turning a simple URL into a complicated dashboard.
                </p>
              </div>

              {/* Feature 3 */}
              <div className="border-r border-b border-neutral-200 p-7 md:p-8">
                <div className="flex items-start justify-between mb-14">
                  <span className="text-xs text-neutral-400 font-mono">
                    03
                  </span>

                  <Shield className="h-5 w-5 text-neutral-400" />
                </div>

                <h3 className="text-lg font-semibold mb-3">
                  Built with control
                </h3>

                <p className="text-sm leading-relaxed text-neutral-500">
                  Custom slugs, privacy controls, and expiration
                  options when you need more than a basic redirect.
                </p>
              </div>

            </div>
          </div>
        </section>

        {/* CTA */}
        {!user && (
          <section className="border-t border-neutral-200 bg-[#171717] text-white">
            <div className="max-w-6xl mx-auto px-5 md:px-8 py-20 md:py-24">

              <div className="max-w-3xl">
                <p className="text-xs uppercase tracking-[0.2em] text-neutral-500 mb-6">
                  Create an account
                </p>

                <h2 className="text-4xl md:text-6xl font-semibold tracking-[-0.04em] leading-tight">
                  Your links,
                  <br />
                  all in one place.
                </h2>

                <div className="mt-8 flex flex-col sm:flex-row sm:items-center gap-5">
                  <p className="text-neutral-400 max-w-md text-sm leading-relaxed">
                    Save your shortened URLs, create custom slugs,
                    and keep track of your links from one simple dashboard.
                  </p>

                  <Button
                    onClick={() => navigate('/auth')}
                    size="lg"
                    className="rounded-none bg-white text-[#171717] hover:bg-neutral-200 shrink-0"
                  >
                    Create free account
                    <ArrowUpRight className="h-4 w-4 ml-2" />
                  </Button>
                </div>
              </div>

            </div>
          </section>
        )}
      </main>

      {/* Footer */}
      <footer className="border-t border-neutral-200">
        <div className="max-w-6xl mx-auto px-5 md:px-8 py-8 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">

          <div className="flex items-center gap-2">
            <div className="h-6 w-6 bg-[#171717] text-white flex items-center justify-center">
              <LinkIcon className="h-3 w-3" />
            </div>

            <span className="text-sm font-medium">
              Shortie
            </span>
          </div>

          <p className="text-xs text-neutral-400">
            Simple links for the internet.
          </p>
        </div>
      </footer>
    </div>
  );
};

export default Index;

import { useState } from 'react';
import { Navigate, useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { useToast } from '@/hooks/use-toast';
import { useAuth } from '@/hooks/useAuth';
import {
  Link as LinkIcon,
  Mail,
  Lock,
  ArrowLeft,
  ArrowUpRight,
} from 'lucide-react';

export default function Auth() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [mode, setMode] = useState<'signin' | 'signup'>('signin');
  const [loading, setLoading] = useState(false);

  const { toast } = useToast();
  const { signIn, signUp, user } = useAuth();
  const navigate = useNavigate();

  // Redirect if already authenticated
  if (user) {
    return <Navigate to="/" replace />;
  }

  const handleSignIn = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    const { error } = await signIn(email, password);

    if (error) {
      toast({
        title: 'Sign in failed',
        description: error.message,
        variant: 'destructive',
      });
    } else {
      toast({
        title: 'Welcome back',
        description: "You've successfully signed in.",
      });
    }

    setLoading(false);
  };

  const handleSignUp = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    const { error } = await signUp(email, password);

    if (error) {
      toast({
        title: 'Sign up failed',
        description: error.message,
        variant: 'destructive',
      });
    } else {
      toast({
        title: 'Check your email',
        description: 'We sent you a confirmation link.',
      });
    }

    setLoading(false);
  };

  const isSignIn = mode === 'signin';

  return (
    <div className="min-h-screen bg-[#f7f7f5] text-[#171717]">

      {/* Background grid */}
      <div
        className="fixed inset-0 pointer-events-none opacity-[0.035]"
        style={{
          backgroundImage:
            'linear-gradient(#171717 1px, transparent 1px), linear-gradient(90deg, #171717 1px, transparent 1px)',
          backgroundSize: '48px 48px',
        }}
      />

      {/* Header */}
      <header className="relative border-b border-neutral-200">
        <div className="max-w-6xl mx-auto px-5 md:px-8 h-16 flex items-center justify-between">

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

          <button
            onClick={() => navigate('/')}
            className="flex items-center gap-2 text-sm text-neutral-500 hover:text-neutral-900 transition-colors"
          >
            <ArrowLeft className="h-4 w-4" />
            Back
          </button>

        </div>
      </header>

      {/* Main */}
      <main className="relative min-h-[calc(100vh-4rem)] flex items-center justify-center px-5 py-16">

        <div className="w-full max-w-md">

          {/* Intro */}
          <div className="mb-8">

            <div className="flex items-center gap-3 mb-6">
              <span className="h-px w-8 bg-[#171717]" />

              <span className="text-xs uppercase tracking-[0.2em] text-neutral-400">
                {isSignIn ? 'Account access' : 'Get started'}
              </span>
            </div>

            <h1 className="text-4xl md:text-5xl font-semibold tracking-[-0.045em] leading-none">
              {isSignIn ? (
                <>
                  Welcome
                  <br />
                  <span className="text-neutral-400">back.</span>
                </>
              ) : (
                <>
                  Make an
                  <br />
                  <span className="text-neutral-400">account.</span>
                </>
              )}
            </h1>

            <p className="mt-5 text-sm leading-relaxed text-neutral-500 max-w-sm">
              {isSignIn
                ? 'Sign in to manage your shortened links and view their activity.'
                : 'Create an account to save your links, use custom slugs, and track clicks.'}
            </p>

          </div>

          {/* Auth box */}
          <div className="border border-neutral-300 bg-white shadow-[8px_8px_0_#171717]">

            {/* Mode switch */}
            <div className="grid grid-cols-2 border-b border-neutral-200">

              <button
                type="button"
                onClick={() => setMode('signin')}
                className={`
                  h-12
                  text-sm
                  font-medium
                  border-r
                  border-neutral-200
                  transition-colors
                  ${
                    isSignIn
                      ? 'bg-[#171717] text-white'
                      : 'bg-white text-neutral-400 hover:bg-neutral-50 hover:text-neutral-900'
                  }
                `}
              >
                Sign in
              </button>

              <button
                type="button"
                onClick={() => setMode('signup')}
                className={`
                  h-12
                  text-sm
                  font-medium
                  transition-colors
                  ${
                    !isSignIn
                      ? 'bg-[#171717] text-white'
                      : 'bg-white text-neutral-400 hover:bg-neutral-50 hover:text-neutral-900'
                  }
                `}
              >
                Sign up
              </button>

            </div>

            {/* Form */}
            <div className="p-6 md:p-7">

              <form
                onSubmit={isSignIn ? handleSignIn : handleSignUp}
                className="space-y-5"
              >

                {/* Email */}
                <div>
                  <label className="block text-xs uppercase tracking-[0.15em] font-medium text-neutral-500 mb-2">
                    Email
                  </label>

                  <div className="relative">
                    <Mail className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-neutral-400 pointer-events-none" />

                    <Input
                      type="email"
                      placeholder="you@example.com"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      required
                      className="
                        h-12
                        rounded-none
                        border-neutral-300
                        bg-[#fafafa]
                        pl-10
                        pr-4
                        shadow-none
                        text-sm
                        placeholder:text-neutral-400
                        focus-visible:ring-0
                        focus-visible:border-neutral-900
                      "
                    />
                  </div>
                </div>

                {/* Password */}
                <div>
                  <div className="flex items-center justify-between mb-2">
                    <label className="block text-xs uppercase tracking-[0.15em] font-medium text-neutral-500">
                      Password
                    </label>

                    {!isSignIn && (
                      <span className="text-[11px] text-neutral-400">
                        6+ characters
                      </span>
                    )}
                  </div>

                  <div className="relative">
                    <Lock className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-neutral-400 pointer-events-none" />

                    <Input
                      type="password"
                      placeholder={
                        isSignIn
                          ? 'Your password'
                          : 'Create a password'
                      }
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      required
                      minLength={6}
                      className="
                        h-12
                        rounded-none
                        border-neutral-300
                        bg-[#fafafa]
                        pl-10
                        pr-4
                        shadow-none
                        text-sm
                        placeholder:text-neutral-400
                        focus-visible:ring-0
                        focus-visible:border-neutral-900
                      "
                    />
                  </div>
                </div>

                {/* Submit */}
                <Button
                  type="submit"
                  disabled={loading}
                  className="
                    w-full
                    h-12
                    rounded-none
                    bg-[#171717]
                    text-white
                    hover:bg-neutral-800
                    transition-colors
                    mt-2
                  "
                >
                  {loading ? (
                    <>
                      <span className="h-4 w-4 mr-2 border-2 border-neutral-500 border-t-white rounded-full animate-spin" />

                      {isSignIn
                        ? 'Signing in'
                        : 'Creating account'}
                    </>
                  ) : (
                    <>
                      {isSignIn
                        ? 'Sign in'
                        : 'Create account'}

                      <ArrowUpRight className="h-4 w-4 ml-2" />
                    </>
                  )}
                </Button>

              </form>

              {/* Bottom note */}
              <div className="mt-6 pt-5 border-t border-neutral-100">
                <p className="text-xs leading-relaxed text-neutral-400">
                  {isSignIn
                    ? "Don't have an account? Switch to Sign up above."
                    : 'Already have an account? Switch to Sign in above.'}
                </p>
              </div>

            </div>
          </div>

          {/* Footer detail */}
          <div className="mt-6 flex items-center justify-between text-[11px] uppercase tracking-wider text-neutral-400">
            <span>Shortie</span>
            <span>Simple links for the internet</span>
          </div>

        </div>
      </main>
    </div>
  );
}

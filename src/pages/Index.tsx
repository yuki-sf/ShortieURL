import { Link, useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { UrlShortener } from '@/components/UrlShortener';
import { UserLinks } from '@/components/UserLinks';
import { useAuth } from '@/hooks/useAuth';
import { Link as LinkIcon, User, LogOut, Sparkles, Zap, Shield, Clock } from 'lucide-react';

const Index = () => {
  const { user, signOut, loading } = useAuth();
  const navigate = useNavigate();

  const handleSignOut = async () => {
    await signOut();
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-subtle">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4"></div>
          <p className="text-muted-foreground">Loading ShortieURL...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-subtle">
      {/* Header */}
      <header className="border-b border-border/50 bg-card/80 backdrop-blur-sm sticky top-0 z-50">
        <div className="container mx-auto px-4 py-4 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <LinkIcon className="h-8 w-8 text-primary animate-pulse" />
            <h1 className="text-2xl font-bold bg-gradient-primary bg-clip-text text-transparent">
              ShortieURL
            </h1>
            <Sparkles className="h-6 w-6 text-accent animate-bounce" />
          </div>
          
          <div className="flex items-center gap-2">
            {user ? (
              <>
                <span className="text-sm text-muted-foreground">
                  Welcome, {user.email?.split('@')[0]}! 👋
                </span>
                <Button
                  onClick={handleSignOut}
                  variant="ghost"
                  size="sm"
                  className="hover:bg-accent/20"
                >
                  <LogOut className="h-4 w-4 mr-2" />
                  Sign Out
                </Button>
              </>
            ) : (
              <Button
                onClick={() => navigate('/auth')}
                className="bg-gradient-primary hover:opacity-90 transform hover:scale-105 transition-all duration-300"
              >
                <User className="h-4 w-4 mr-2" />
                Sign In
              </Button>
            )}
          </div>
        </div>
      </header>

      {/* Hero Section */}
      <section className="py-20 px-4">
        <div className="container mx-auto text-center">
          <div className="max-w-4xl mx-auto mb-12">
            <h2 className="text-5xl md:text-7xl font-bold mb-6">
              <span className="bg-gradient-primary bg-clip-text text-transparent">
                Shorten
              </span>{' '}
              <span className="bg-gradient-accent bg-clip-text text-transparent">
                URLs
              </span>
              <br />
              <span className="text-3xl md:text-5xl">Make them cute & memorable ✨</span>
            </h2>
            <p className="text-xl text-muted-foreground mb-8 max-w-2xl mx-auto">
              Transform your long, boring URLs into short, beautiful links that are easy to share and remember. 
              Track clicks, customize slugs, and make the web a prettier place! 🔗
            </p>
          </div>

          {/* URL Shortener Component */}
          <UrlShortener />

          {/* User Links Section */}
          {user && (
            <div className="mt-16">
              <UserLinks />
            </div>
          )}

          {/* Features */}
          <div className="grid md:grid-cols-3 gap-8 mt-16 max-w-4xl mx-auto">
            <div className="text-center p-6">
              <div className="w-16 h-16 bg-gradient-primary rounded-2xl flex items-center justify-center mx-auto mb-4 shadow-glow">
                <Zap className="h-8 w-8 text-primary-foreground" />
              </div>
              <h3 className="text-xl font-semibold mb-2">Lightning Fast</h3>
              <p className="text-muted-foreground">
                Generate short URLs instantly with our optimized backend
              </p>
            </div>

            <div className="text-center p-6">
              <div className="w-16 h-16 bg-gradient-accent rounded-2xl flex items-center justify-center mx-auto mb-4 shadow-glow">
                <Shield className="h-8 w-8 text-accent-foreground" />
              </div>
              <h3 className="text-xl font-semibold mb-2">Secure & Private</h3>
              <p className="text-muted-foreground">
                Optional password protection and privacy settings for your links
              </p>
            </div>

            <div className="text-center p-6">
              <div className="w-16 h-16 bg-gradient-primary rounded-2xl flex items-center justify-center mx-auto mb-4 shadow-glow">
                <Clock className="h-8 w-8 text-primary-foreground" />
              </div>
              <h3 className="text-xl font-semibold mb-2">Smart Expiration</h3>
              <p className="text-muted-foreground">
                Set expiration dates for temporary links and campaigns
              </p>
            </div>
          </div>

          {/* Call to Action */}
          {!user && (
            <div className="mt-16 p-8 rounded-3xl bg-gradient-accent/10 border border-accent/20 max-w-2xl mx-auto">
              <h3 className="text-2xl font-bold mb-4">Ready to get started? 🚀</h3>
              <p className="text-muted-foreground mb-6">
                Sign up for a free account to track your links, create custom slugs, and access advanced features!
              </p>
              <Button
                onClick={() => navigate('/auth')}
                size="lg"
                className="bg-gradient-accent hover:opacity-90 transform hover:scale-105 transition-all duration-300"
              >
                Create Free Account ✨
              </Button>
            </div>
          )}
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-border/50 py-8 mt-20">
        <div className="container mx-auto px-4 text-center">
          <p className="text-muted-foreground">
            Made with ❤️ using ShortieURL • Transform the web, one link at a time 🔗
          </p>
        </div>
      </footer>
    </div>
  );
};

export default Index;

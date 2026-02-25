import { GraduationCap, Code2, Moon, Sun, Users, LogIn, LogOut, Database } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useTheme } from 'next-themes';
import { useInternetIdentity } from '@/hooks/useInternetIdentity';
import { useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';

interface HeaderProps {
  activeModule: 'academic' | 'coding' | 'users' | 'data';
  setActiveModule: (module: 'academic' | 'coding' | 'users' | 'data') => void;
  isAdmin: boolean;
}

export default function Header({ activeModule, setActiveModule, isAdmin }: HeaderProps) {
  const { theme, setTheme } = useTheme();
  const { login, clear, loginStatus, identity } = useInternetIdentity();
  const queryClient = useQueryClient();

  const isAuthenticated = !!identity;
  const isLoggingIn = loginStatus === 'logging-in';

  const handleAuth = async () => {
    if (isAuthenticated) {
      await clear();
      queryClient.clear();
      toast.success('Logged out successfully');
    } else {
      try {
        await login();
        toast.success('Logged in successfully');
      } catch (error: any) {
        console.error('Login error:', error);
        if (error.message === 'User is already authenticated') {
          await clear();
          setTimeout(() => login(), 300);
        } else {
          toast.error('Login failed. Please try again.');
        }
      }
    }
  };

  return (
    <header className="border-b border-border/40 bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60 sticky top-0 z-50">
      <div className="container mx-auto px-4 py-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-primary to-primary/60 flex items-center justify-center">
              <GraduationCap className="w-6 h-6 text-primary-foreground" />
            </div>
            <div>
              <h1 className="text-xl font-bold bg-gradient-to-r from-foreground to-foreground/70 bg-clip-text text-transparent">
                Academic Progress
              </h1>
              <p className="text-xs text-muted-foreground">Track & Practice</p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            {isAuthenticated && (
              <div className="flex items-center gap-1 p-1 bg-muted/50 rounded-lg">
                <Button
                  variant={activeModule === 'academic' ? 'default' : 'ghost'}
                  size="sm"
                  onClick={() => setActiveModule('academic')}
                  className="gap-2"
                >
                  <GraduationCap className="w-4 h-4" />
                  <span className="hidden sm:inline">Academic</span>
                </Button>
                <Button
                  variant={activeModule === 'coding' ? 'default' : 'ghost'}
                  size="sm"
                  onClick={() => setActiveModule('coding')}
                  className="gap-2"
                >
                  <Code2 className="w-4 h-4" />
                  <span className="hidden sm:inline">Coding</span>
                </Button>
                <Button
                  variant={activeModule === 'data' ? 'default' : 'ghost'}
                  size="sm"
                  onClick={() => setActiveModule('data')}
                  className="gap-2"
                >
                  <Database className="w-4 h-4" />
                  <span className="hidden sm:inline">Data</span>
                </Button>
                {isAdmin && (
                  <Button
                    variant={activeModule === 'users' ? 'default' : 'ghost'}
                    size="sm"
                    onClick={() => setActiveModule('users')}
                    className="gap-2"
                  >
                    <Users className="w-4 h-4" />
                    <span className="hidden sm:inline">Users</span>
                  </Button>
                )}
              </div>
            )}

            <Button
              variant="ghost"
              size="icon"
              onClick={() => setTheme(theme === 'dark' ? 'light' : 'dark')}
              className="ml-2"
            >
              <Sun className="h-5 w-5 rotate-0 scale-100 transition-all dark:-rotate-90 dark:scale-0" />
              <Moon className="absolute h-5 w-5 rotate-90 scale-0 transition-all dark:rotate-0 dark:scale-100" />
              <span className="sr-only">Toggle theme</span>
            </Button>

            <Button
              onClick={handleAuth}
              disabled={isLoggingIn}
              variant={isAuthenticated ? 'outline' : 'default'}
              size="sm"
              className="gap-2"
            >
              {isLoggingIn ? (
                <>
                  <span className="animate-spin">⏳</span>
                  <span className="hidden sm:inline">Logging in...</span>
                </>
              ) : isAuthenticated ? (
                <>
                  <LogOut className="w-4 h-4" />
                  <span className="hidden sm:inline">Logout</span>
                </>
              ) : (
                <>
                  <LogIn className="w-4 h-4" />
                  <span className="hidden sm:inline">Login</span>
                </>
              )}
            </Button>
          </div>
        </div>
      </div>
    </header>
  );
}


import { useState } from 'react';
import { ThemeProvider } from 'next-themes';
import { Toaster } from '@/components/ui/sonner';
import Header from '@/components/Header';
import Footer from '@/components/Footer';
import AcademicModule from '@/components/AcademicModule';
import CodingModule from '@/components/CodingModule';
import UserManagement from '@/components/UserManagement';
import DataManagement from '@/components/DataManagement';
import ProfileSetup from '@/components/ProfileSetup';
import { useInternetIdentity } from '@/hooks/useInternetIdentity';
import { useGetCallerUserProfile, useIsCallerAdmin } from '@/hooks/useQueries';
import { Loader2 } from 'lucide-react';

export default function App() {
  const [activeModule, setActiveModule] = useState<'academic' | 'coding' | 'users' | 'data'>('academic');
  const { identity, isInitializing } = useInternetIdentity();
  const isAuthenticated = !!identity;

  const { data: userProfile, isLoading: profileLoading, isFetched } = useGetCallerUserProfile();
  const { data: isAdmin, isLoading: adminLoading } = useIsCallerAdmin();

  const showProfileSetup = isAuthenticated && !profileLoading && isFetched && userProfile === null;

  if (isInitializing) {
    return (
      <ThemeProvider attribute="class" defaultTheme="system" enableSystem>
        <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-background via-background to-accent/5">
          <div className="text-center space-y-4">
            <Loader2 className="w-8 h-8 animate-spin mx-auto text-primary" />
            <p className="text-muted-foreground">Loading...</p>
          </div>
        </div>
        <Toaster />
      </ThemeProvider>
    );
  }

  if (!isAuthenticated) {
    return (
      <ThemeProvider attribute="class" defaultTheme="system" enableSystem>
        <div className="min-h-screen flex flex-col bg-gradient-to-br from-background via-background to-accent/5">
          <Header activeModule={activeModule} setActiveModule={setActiveModule} isAdmin={false} />
          <main className="flex-1 flex items-center justify-center container mx-auto px-4 py-8">
            <div className="text-center space-y-6 max-w-md">
              <div className="w-20 h-20 rounded-full bg-gradient-to-br from-primary to-primary/60 flex items-center justify-center mx-auto">
                <svg
                  className="w-10 h-10 text-primary-foreground"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z"
                  />
                </svg>
              </div>
              <div>
                <h2 className="text-2xl font-bold mb-2">Welcome to Academic Progress</h2>
                <p className="text-muted-foreground">
                  Please log in to access your academic tracking and coding practice modules
                </p>
              </div>
            </div>
          </main>
          <Footer />
          <Toaster />
        </div>
      </ThemeProvider>
    );
  }

  if (showProfileSetup) {
    return (
      <ThemeProvider attribute="class" defaultTheme="system" enableSystem>
        <div className="min-h-screen flex flex-col bg-gradient-to-br from-background via-background to-accent/5">
          <Header activeModule={activeModule} setActiveModule={setActiveModule} isAdmin={false} />
          <main className="flex-1 flex items-center justify-center container mx-auto px-4 py-8">
            <ProfileSetup />
          </main>
          <Footer />
          <Toaster />
        </div>
      </ThemeProvider>
    );
  }

  return (
    <ThemeProvider attribute="class" defaultTheme="system" enableSystem>
      <div className="min-h-screen flex flex-col bg-gradient-to-br from-background via-background to-accent/5">
        <Header
          activeModule={activeModule}
          setActiveModule={setActiveModule}
          isAdmin={isAdmin || false}
        />
        <main className="flex-1 container mx-auto px-4 py-8">
          {activeModule === 'academic' && <AcademicModule />}
          {activeModule === 'coding' && <CodingModule />}
          {activeModule === 'data' && <DataManagement />}
          {activeModule === 'users' && isAdmin && <UserManagement />}
        </main>
        <Footer />
        <Toaster />
      </div>
    </ThemeProvider>
  );
}

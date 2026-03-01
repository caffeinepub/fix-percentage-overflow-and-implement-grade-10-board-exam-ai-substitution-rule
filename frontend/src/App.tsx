import React, { useState } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import { ThemeProvider } from 'next-themes';
import { useInternetIdentity } from './hooks/useInternetIdentity';
import { useActor } from './hooks/useActor';
import Header from './components/Header';
import Footer from './components/Footer';
import AcademicModule from './components/AcademicModule';
import CodingModule from './components/CodingModule';
import DataManagement from './components/DataManagement';
import UserManagement from './components/UserManagement';
import ProfileSetup from './components/ProfileSetup';
import { LoadingState } from './components/LoadingState';
import { ErrorMessage } from './components/ErrorMessage';
import { ErrorBoundary } from './components/ErrorBoundary';
import { useGetCallerUserProfile, useIsCallerAdmin } from './hooks/useQueries';
import { Toaster } from '@/components/ui/sonner';

type ActiveModule = 'academic' | 'coding' | 'data' | 'users';

function AppContent() {
  const { identity, loginStatus } = useInternetIdentity();
  const { actor, isFetching: actorFetching } = useActor();
  const queryClient = useQueryClient();
  const [activeModule, setActiveModule] = useState<ActiveModule>('academic');

  const isAuthenticated = !!identity;
  const isLoggingIn = loginStatus === 'logging-in';

  const {
    data: userProfile,
    isLoading: profileLoading,
    isFetched: profileFetched,
    error: profileError,
    refetch: refetchProfile,
  } = useGetCallerUserProfile();

  const {
    data: isAdmin,
    isLoading: adminLoading,
  } = useIsCallerAdmin();

  // Show loading while actor is initializing
  if (actorFetching) {
    return (
      <div className="min-h-screen flex flex-col bg-background">
        <LoadingState
          fullScreen
          message="Connecting to backend..."
          size="lg"
        />
      </div>
    );
  }

  // Show error if actor failed to initialize (only when authenticated)
  if (!actor && !actorFetching && isAuthenticated) {
    return (
      <div className="min-h-screen flex flex-col bg-background">
        <div className="flex-1 flex items-center justify-center p-6">
          <div className="max-w-md w-full">
            <ErrorMessage
              title="Connection Failed"
              message="Failed to connect to the backend. Please refresh the page or try again later."
              onRetry={() => {
                queryClient.invalidateQueries();
                window.location.reload();
              }}
              retryLabel="Refresh Page"
            />
          </div>
        </div>
      </div>
    );
  }

  // Show profile setup for authenticated users without a profile
  const showProfileSetup =
    isAuthenticated &&
    !actorFetching &&
    !profileLoading &&
    profileFetched &&
    userProfile === null &&
    !profileError;

  return (
    <div className="min-h-screen flex flex-col bg-background">
      <Header
        activeModule={activeModule}
        setActiveModule={setActiveModule}
        isAdmin={!!isAdmin}
      />

      <main className="flex-1 container mx-auto px-4 py-6 max-w-7xl">
        {!isAuthenticated ? (
          <div className="flex flex-col items-center justify-center min-h-[60vh] text-center">
            <div className="max-w-md space-y-4">
              <div className="rounded-full bg-primary/10 p-6 w-24 h-24 mx-auto flex items-center justify-center">
                <span className="text-4xl">📚</span>
              </div>
              <h2 className="text-2xl font-bold text-foreground">Welcome to Academic Tracker</h2>
              <p className="text-muted-foreground">
                Please log in to access your academic records, coding challenges, and more.
              </p>
              {isLoggingIn && (
                <LoadingState message="Logging in..." size="sm" className="min-h-0 py-2" />
              )}
            </div>
          </div>
        ) : showProfileSetup ? (
          <div className="flex items-center justify-center min-h-[60vh]">
            <ProfileSetup />
          </div>
        ) : profileLoading || adminLoading ? (
          <LoadingState message="Loading your profile..." size="md" />
        ) : (
          <ErrorBoundary>
            {activeModule === 'academic' && <AcademicModule />}
            {activeModule === 'coding' && <CodingModule />}
            {activeModule === 'data' && <DataManagement />}
            {activeModule === 'users' && isAdmin && <UserManagement />}
          </ErrorBoundary>
        )}
      </main>

      <Footer />
      <Toaster />
    </div>
  );
}

export default function App() {
  return (
    <ThemeProvider attribute="class" defaultTheme="system" enableSystem>
      <ErrorBoundary
        fallback={
          <div className="min-h-screen flex items-center justify-center bg-background p-6">
            <div className="max-w-md w-full text-center space-y-4">
              <div className="rounded-full bg-destructive/10 p-4 w-16 h-16 mx-auto flex items-center justify-center">
                <span className="text-2xl">⚠️</span>
              </div>
              <h2 className="text-xl font-bold text-foreground">Application Error</h2>
              <p className="text-muted-foreground">
                Something went wrong. Please refresh the page to try again.
              </p>
              <button
                onClick={() => window.location.reload()}
                className="px-4 py-2 bg-primary text-primary-foreground rounded-md hover:bg-primary/90 transition-colors"
              >
                Refresh Page
              </button>
            </div>
          </div>
        }
      >
        <AppContent />
      </ErrorBoundary>
    </ThemeProvider>
  );
}

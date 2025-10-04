'use client';

import { usePathname, useRouter } from 'next/navigation';
import { useEffect } from 'react';
import { useUser, useFirestore, useDoc, useMemoFirebase } from '@/firebase';
import { doc } from 'firebase/firestore';
import { Skeleton } from '../ui/skeleton';

interface AuthGuardProps {
  children: React.ReactNode;
}

export function AuthGuard({ children }: AuthGuardProps) {
  const { user, isUserLoading } = useUser();
  const firestore = useFirestore();
  const router = useRouter();
  const pathname = usePathname();

  const userDocRef = useMemoFirebase(
    () => (user && firestore ? doc(firestore, 'users', user.uid) : null),
    [user, firestore]
  );
  const { data: userData, isLoading: isUserDataLoading } = useDoc<{ isAdmin: boolean }>(userDocRef);

  const isLoading = isUserLoading || isUserDataLoading;

  useEffect(() => {
    if (isLoading) {
      return; // Wait for user and user data to load
    }

    const isAuthRoute = pathname.startsWith('/login') || pathname.startsWith('/register');
    const isLandingPage = pathname === '/';

    // If the user is not logged in
    if (!user) {
      if (!isAuthRoute && !isLandingPage) {
        router.replace('/login');
      }
      return;
    }

    // If the user is logged in
    const isAdmin = userData?.isAdmin ?? false;

    if (isAuthRoute) {
      // If logged in and trying to access login/register, redirect to their default page
      router.replace(isAdmin ? '/admin' : '/dashboard');
      return;
    }

    if (pathname.startsWith('/admin') && !isAdmin) {
      // If not an admin and trying to access /admin, redirect
      router.replace('/dashboard');
      return;
    }

  }, [user, userData, isLoading, pathname, router]);

  // While loading, show a skeleton screen to prevent flickering
  if (isLoading && pathname !== '/') {
     return (
      <div className="flex h-screen w-full items-center justify-center">
        <div className="space-y-4 w-1/2">
            <Skeleton className="h-12 w-full" />
            <Skeleton className="h-32 w-full" />
            <div className="flex gap-4">
               <Skeleton className="h-32 w-full" />
               <Skeleton className="h-32 w-full" />
            </div>
        </div>
      </div>
    );
  }

  // Allow access to the landing page or auth pages if not logged in
  const isAuthRoute = pathname.startsWith('/login') || pathname.startsWith('/register');
  if(pathname === '/' || (!user && isAuthRoute)) {
    return <>{children}</>;
  }
  
  // If the user is logged in but data is still loading (to prevent flicker), show loading
  if(user && isLoading) {
     return (
        <div className="flex h-screen w-full items-center justify-center">
            <div className="space-y-4 w-1/2">
                <Skeleton className="h-12 w-full" />
                <Skeleton className="h-32 w-full" />
                <div className="flex gap-4">
                <Skeleton className="h-32 w-full" />
                <Skeleton className="h-32 w-full" />
                </div>
            </div>
        </div>
    )
  }

  // If the user is logged in and has the necessary data, show the page content
  if (user && userData) {
    return <>{children}</>;
  }

  return null; // Don't render anything while redirecting or checking
}

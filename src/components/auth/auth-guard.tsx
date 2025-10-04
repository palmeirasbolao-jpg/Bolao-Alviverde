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
      return; // Aguarda o carregamento do usuário e dos seus dados
    }

    const isAuthRoute = pathname.startsWith('/login') || pathname.startsWith('/register');

    // Se o usuário não está logado
    if (!user) {
      if (!isAuthRoute && pathname !== '/') {
        router.replace('/login');
      }
      return;
    }

    // Se o usuário está logado
    const isAdmin = userData?.isAdmin ?? false;

    if (isAuthRoute) {
      // Se estiver logado e tentar acessar login/registro, redireciona
      router.replace(isAdmin ? '/admin' : '/dashboard');
      return;
    }

    if (pathname.startsWith('/admin') && !isAdmin) {
      // Se não for admin e tentar acessar /admin, redireciona
      router.replace('/dashboard');
      return;
    }

    if (pathname.startsWith('/dashboard') && isAdmin) {
      // Se for admin e tentar acessar /dashboard, redireciona para o painel de admin
      router.replace('/admin');
      return;
    }

  }, [user, userData, isLoading, pathname, router]);

  // Enquanto carrega, mostra uma tela de loading para evitar piscar de tela
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

  // Permite acesso à landing page ou às páginas de autenticação se não estiver logado
  if(pathname === '/' || (!user && isAuthRoute)) {
    return <>{children}</>;
  }
  
  // Se o usuário estiver logado, mas os dados ainda não carregaram (para evitar piscar), mostra loading
  if(user && !userData && !pathname.startsWith('/admin')) {
     if(isLoading) {
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
  }


  // Se o usuário está logado e tem os dados necessários, mostra o conteúdo da página
  if (user && (userData || pathname.startsWith('/admin'))) {
    return <>{children}</>;
  }


  return null; // Não renderiza nada enquanto redireciona ou verifica
}

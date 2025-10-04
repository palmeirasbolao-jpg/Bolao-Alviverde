import type { ReactNode } from "react";
import { SidebarProvider } from "@/components/ui/sidebar";
import { AppSidebar } from "@/components/layout/app-sidebar";
import { AppHeader } from "@/components/layout/app-header";
import { FirebaseClientProvider } from "@/firebase";
import { AuthGuard } from "@/components/auth/auth-guard";

export default function AppLayout({ children }: { children: ReactNode }) {
  return (
    <FirebaseClientProvider>
      <AuthGuard>
        <SidebarProvider>
          <div className="flex min-h-screen">
            <AppSidebar />
            <div className="flex flex-col flex-1">
              <AppHeader />
              <main className="flex-1 p-4 sm:p-6 lg:p-8">
                {children}
              </main>
            </div>
          </div>
        </SidebarProvider>
      </AuthGuard>
    </FirebaseClientProvider>
  );
}

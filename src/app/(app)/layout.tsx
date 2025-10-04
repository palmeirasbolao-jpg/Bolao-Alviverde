import type { ReactNode } from "react";
import { SidebarProvider } from "@/components/ui/sidebar";
import { AppSidebar } from "@/components/layout/app-sidebar";
import { AppHeader } from "@/components/layout/app-header";
import { FirebaseClientProvider } from "@/firebase";

export default function AppLayout({ children }: { children: ReactNode }) {
  return (
    <FirebaseClientProvider>
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
    </FirebaseClientProvider>
  );
}

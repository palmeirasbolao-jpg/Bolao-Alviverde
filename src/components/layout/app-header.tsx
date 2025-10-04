import { SidebarTrigger } from "@/components/ui/sidebar";

export function AppHeader() {
  return (
    <header className="sticky top-0 z-10 flex h-14 items-center gap-4 border-b bg-background px-4 sm:static sm:h-auto sm:border-0 sm:bg-transparent sm:px-6">
      <div className="md:hidden">
        <SidebarTrigger />
      </div>
      {/* Can add Breadcrumbs or other header elements here */}
    </header>
  );
}

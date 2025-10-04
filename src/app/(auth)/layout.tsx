import { Logo } from "@/components/icons/logo";
import Link from "next/link";
import { FirebaseClientProvider } from "@/firebase";
import { AuthGuard } from "@/components/auth/auth-guard";

export default function AuthLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <FirebaseClientProvider>
      <AuthGuard>
        <div className="flex min-h-screen flex-col items-center justify-center bg-gray-50 dark:bg-gray-900/20 p-4">
          <div className="mb-6">
            <Link href="/">
              <Logo />
            </Link>
          </div>
          {children}
        </div>
      </AuthGuard>
    </FirebaseClientProvider>
  );
}

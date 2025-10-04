"use client";

import Link from "next/link";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { LogOut } from "lucide-react";
import { useUser, useAuth } from "@/firebase";
import { signOut } from "firebase/auth";
import { useRouter } from "next/navigation";

export function UserNav() {
  const { user, isUserLoading } = useUser();
  const auth = useAuth();
  const router = useRouter();

  const handleSignOut = async () => {
    await signOut(auth);
    router.push("/");
  };

  if (isUserLoading) {
    return (
       <div className="flex items-center space-x-2 p-2">
         <div className="h-8 w-8 rounded-full bg-muted animate-pulse" />
         <div className="space-y-1">
            <div className="h-4 w-24 rounded-md bg-muted animate-pulse" />
            <div className="h-3 w-32 rounded-md bg-muted animate-pulse" />
         </div>
       </div>
    );
  }

  if (!user) {
    return null; // Or a login button
  }

  const userInitial = user.email ? user.email.charAt(0).toUpperCase() : "U";

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button
          variant="ghost"
          className="relative h-10 w-full justify-start gap-2 px-2"
        >
          <Avatar className="h-8 w-8">
            {user.photoURL ? (
                <AvatarImage src={user.photoURL} alt="Avatar" />
            ): (
                 <AvatarFallback>{userInitial}</AvatarFallback>
            )}
          </Avatar>
          <div className="text-left group-data-[collapsible=icon]:hidden">
             <p className="text-sm font-medium">{user.displayName || user.email}</p>
             <p className="text-xs text-muted-foreground">
               {user.email}
             </p>
          </div>
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent className="w-56" align="end" forceMount>
        <DropdownMenuLabel className="font-normal">
          <div className="flex flex-col space-y-1">
            <p className="text-sm font-medium leading-none">{user.displayName || "Usuário"}</p>
            <p className="text-xs leading-none text-muted-foreground">
              {user.email}
            </p>
          </div>
        </DropdownMenuLabel>
        <DropdownMenuSeparator />
        <DropdownMenuGroup>
          {/* Add profile/settings links here if needed */}
        </DropdownMenuGroup>
        <DropdownMenuSeparator />
        <DropdownMenuItem onClick={handleSignOut}>
          <LogOut className="mr-2 h-4 w-4" />
          <span>Sair</span>
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}

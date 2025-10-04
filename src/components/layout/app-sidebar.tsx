'use client';

import Link from 'next/link';
import {
  Sidebar,
  SidebarHeader,
  SidebarContent,
  SidebarFooter,
  SidebarMenu,
  SidebarMenuItem,
  SidebarMenuButton,
  SidebarSeparator,
  SidebarGroup,
  SidebarGroupLabel,
} from '@/components/ui/sidebar';
import { Landmark, LayoutDashboard, Swords, Trophy, Users } from 'lucide-react';
import { Logo } from '@/components/icons/logo';
import { UserNav } from './user-nav';
import { useUser, useDoc, useMemoFirebase, useFirestore } from '@/firebase';
import { doc } from 'firebase/firestore';

export function AppSidebar() {
  const { user } = useUser();
  const firestore = useFirestore();
  
  const userDocRef = useMemoFirebase(() => {
    if (!user || !firestore) return null;
    return doc(firestore, "users", user.uid);
  }, [user, firestore]);

  const { data: userData } = useDoc<{ isAdmin: boolean }>(userDocRef);
  const isAdmin = userData?.isAdmin ?? false;

  return (
    <Sidebar>
      <SidebarHeader>
        <Logo />
      </SidebarHeader>
      <SidebarContent>
        <SidebarMenu>
          <SidebarGroup>
            <SidebarGroupLabel>Jogador</SidebarGroupLabel>
            <SidebarMenuItem>
              <SidebarMenuButton asChild tooltip="Palpites" isActive>
                <Link href="/dashboard">
                  <Swords />
                  <span>Palpites</span>
                </Link>
              </SidebarMenuButton>
            </SidebarMenuItem>
            <SidebarMenuItem>
              <SidebarMenuButton asChild tooltip="Ranking">
                <Link href="/dashboard/ranking">
                  <Trophy />
                  <span>Ranking</span>
                </Link>
              </SidebarMenuButton>
            </SidebarMenuItem>
          </SidebarGroup>

          {isAdmin && (
            <>
              <SidebarSeparator />
              <SidebarGroup>
                <SidebarGroupLabel>Administrador</SidebarGroupLabel>
                <SidebarMenuItem>
                  <SidebarMenuButton asChild tooltip="Dashboard">
                    <Link href="/admin">
                      <LayoutDashboard />
                      <span>Dashboard</span>
                    </Link>
                  </SidebarMenuButton>
                </SidebarMenuItem>
                <SidebarMenuItem>
                  <SidebarMenuButton asChild tooltip="Gerenciar Partidas">
                    <Link href="/admin/matches">
                      <Landmark />
                      <span>Partidas</span>
                    </Link>
                  </SidebarMenuButton>
                </SidebarMenuItem>
                <SidebarMenuItem>
                  <SidebarMenuButton asChild tooltip="Gerenciar Jogadores">
                    <Link href="/admin/players">
                      <Users />
                      <span>Jogadores</span>
                    </Link>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              </SidebarGroup>
            </>
          )}
        </SidebarMenu>
      </SidebarContent>
      <SidebarFooter>
        <UserNav />
      </SidebarFooter>
    </Sidebar>
  );
}

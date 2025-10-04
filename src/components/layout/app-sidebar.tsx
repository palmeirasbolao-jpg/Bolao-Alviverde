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
import { useUser, useDoc, useMemoFirebase } from '@/firebase';
import { doc } from 'firebase/firestore';

export function AppSidebar() {
  const { user } = useUser();
  
  const userDocRef = useMemoFirebase(() => {
    if (!user) return null;
    return doc(getFirestore(), "users", user.uid);
  }, [user]);

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
              <Link href="/dashboard" passHref>
                <SidebarMenuButton asChild tooltip="Palpites" isActive>
                  <a>
                    <Swords />
                    <span>Palpites</span>
                  </a>
                </SidebarMenuButton>
              </Link>
            </SidebarMenuItem>
            <SidebarMenuItem>
              <Link href="/dashboard/ranking" passHref>
                <SidebarMenuButton asChild tooltip="Ranking">
                  <a>
                    <Trophy />
                    <span>Ranking</span>
                  </a>
                </SidebarMenuButton>
              </Link>
            </SidebarMenuItem>
          </SidebarGroup>

          {isAdmin && (
            <>
              <SidebarSeparator />
              <SidebarGroup>
                <SidebarGroupLabel>Administrador</SidebarGroupLabel>
                <SidebarMenuItem>
                  <Link href="/admin" passHref>
                    <SidebarMenuButton asChild tooltip="Dashboard">
                      <a>
                        <LayoutDashboard />
                        <span>Dashboard</span>
                      </a>
                    </SidebarMenuButton>
                  </Link>
                </SidebarMenuItem>
                <SidebarMenuItem>
                  <Link href="/admin/matches" passHref>
                    <SidebarMenuButton asChild tooltip="Gerenciar Partidas">
                      <a>
                        <Landmark />
                        <span>Partidas</span>
                      </a>
                    </SidebarMenuButton>
                  </Link>
                </SidebarMenuItem>
                <SidebarMenuItem>
                  <Link href="/admin/players" passHref>
                    <SidebarMenuButton asChild tooltip="Gerenciar Jogadores">
                      <a>
                        <Users />
                        <span>Jogadores</span>
                      </a>
                    </SidebarMenuButton>
                  </Link>
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

import Link from "next/link";
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
} from "@/components/ui/sidebar";
import { Landmark, LayoutDashboard, ShieldCheck, Swords, Trophy, Users } from "lucide-react";
import { Logo } from "@/components/icons/logo";
import { UserNav } from "./user-nav";

export function AppSidebar() {
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
              <Link href="/dashboard" legacyBehavior passHref>
                <SidebarMenuButton tooltip="Palpites" isActive>
                  <Swords />
                  <span>Palpites</span>
                </SidebarMenuButton>
              </Link>
            </SidebarMenuItem>
            <SidebarMenuItem>
              <Link href="/dashboard/ranking" legacyBehavior passHref>
                <SidebarMenuButton tooltip="Ranking">
                  <Trophy />
                  <span>Ranking</span>
                </SidebarMenuButton>
              </Link>
            </SidebarMenuItem>
          </SidebarGroup>
          <SidebarSeparator />
          <SidebarGroup>
            <SidebarGroupLabel>Administrador</SidebarGroupLabel>
            <SidebarMenuItem>
              <Link href="/admin" legacyBehavior passHref>
                <SidebarMenuButton tooltip="Dashboard">
                  <LayoutDashboard />
                  <span>Dashboard</span>
                </SidebarMenuButton>
              </Link>
            </SidebarMenuItem>
            <SidebarMenuItem>
              <Link href="/admin/matches" legacyBehavior passHref>
                <SidebarMenuButton tooltip="Gerenciar Partidas">
                  <Landmark />
                  <span>Partidas</span>
                </SidebarMenuButton>
              </Link>
            </SidebarMenuItem>
            <SidebarMenuItem>
              <Link href="/admin/players" legacyBehavior passHref>
                <SidebarMenuButton tooltip="Gerenciar Jogadores">
                  <Users />
                  <span>Jogadores</span>
                </SidebarMenuButton>
              </Link>
            </SidebarMenuItem>
          </SidebarGroup>
        </SidebarMenu>
      </SidebarContent>
      <SidebarFooter>
        <UserNav />
      </SidebarFooter>
    </Sidebar>
  );
}

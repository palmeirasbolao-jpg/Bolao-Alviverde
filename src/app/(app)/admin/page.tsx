import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Landmark, Users } from "lucide-react";
import Link from "next/link";

export default function AdminDashboardPage() {
  return (
    <div className="container mx-auto">
      <div className="mb-8">
        <h1 className="font-headline text-3xl font-bold">Dashboard do Administrador</h1>
        <p className="text-muted-foreground">
          Gerencie as partidas, jogadores e configurações do bolão.
        </p>
      </div>

      <div className="grid gap-6 md:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Landmark className="h-6 w-6" />
              <span>Gerenciar Partidas</span>
            </CardTitle>
            <CardDescription>
              Adicione novas partidas, atualize resultados e gerencie o calendário de jogos.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Button asChild>
              <Link href="/admin/matches">Ir para Partidas</Link>
            </Button>
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Users className="h-6 w-6" />
              <span>Gerenciar Jogadores</span>
            </CardTitle>
            <CardDescription>
              Cadastre novos jogadores, visualize a lista de participantes e edite informações.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Button asChild>
              <Link href="/admin/players">Ir para Jogadores</Link>
            </Button>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

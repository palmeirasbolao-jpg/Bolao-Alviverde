import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { players } from "@/lib/data";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { MoreHorizontal } from "lucide-react";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";

export default function AdminPlayersPage() {
  return (
    <div className="container mx-auto">
      <div className="mb-8 flex justify-between items-center">
        <div>
          <h1 className="font-headline text-3xl font-bold">Gerenciar Jogadores</h1>
          <p className="text-muted-foreground">
            Adicione, edite e visualize os participantes do bolão.
          </p>
        </div>
        <Button>Adicionar Jogador</Button>
      </div>

      <Card>
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Jogador</TableHead>
              <TableHead>Time</TableHead>
              <TableHead>Email</TableHead>
              <TableHead>Role</TableHead>
              <TableHead className="text-right">Pontos</TableHead>
              <TableHead className="text-right">Ações</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {players.map((player) => (
              <TableRow key={player.id}>
                <TableCell className="font-medium">
                  <div className="flex items-center gap-3">
                    <Avatar>
                        <AvatarImage src={`https://picsum.photos/seed/p${player.id}/100/100`} />
                        <AvatarFallback>{player.name.charAt(0)}</AvatarFallback>
                    </Avatar>
                    <span>{player.name}</span>
                </div>
                </TableCell>
                <TableCell>{player.teamName}</TableCell>
                <TableCell>{player.email}</TableCell>
                <TableCell>
                  <Badge variant={player.role === 'admin' ? 'destructive' : 'outline'}>
                    {player.role}
                  </Badge>
                </TableCell>
                <TableCell className="text-right font-bold">{player.score}</TableCell>
                <TableCell className="text-right">
                   <Button variant="ghost" size="icon">
                    <MoreHorizontal className="h-4 w-4" />
                   </Button>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </Card>
    </div>
  );
}

// Dummy Card component to satisfy structure
const Card = ({ children }: { children: React.ReactNode }) => (
  <div className="rounded-lg border bg-card text-card-foreground shadow-sm">
    {children}
  </div>
);

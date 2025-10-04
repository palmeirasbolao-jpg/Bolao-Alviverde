import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { matches } from "@/lib/data";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { MoreHorizontal } from "lucide-react";

export default function AdminMatchesPage() {
  return (
    <div className="container mx-auto">
      <div className="mb-8 flex justify-between items-center">
        <div>
          <h1 className="font-headline text-3xl font-bold">Gerenciar Partidas</h1>
          <p className="text-muted-foreground">
            Adicione, edite e atualize os resultados das partidas.
          </p>
        </div>
        <Button>Adicionar Partida</Button>
      </div>

      <Card>
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Partida</TableHead>
              <TableHead>Data</TableHead>
              <TableHead>Resultado</TableHead>
              <TableHead>Status</TableHead>
              <TableHead className="text-right">Ações</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {matches.map((match) => (
              <TableRow key={match.id}>
                <TableCell className="font-medium">
                  {match.homeTeam} vs {match.awayTeam}
                </TableCell>
                <TableCell>
                  {format(new Date(match.date), "dd/MM/yy HH:mm", { locale: ptBR })}
                </TableCell>
                <TableCell className="font-bold">
                  {match.status === 'finished' ? `${match.homeScore} x ${match.awayScore}` : '-'}
                </TableCell>
                <TableCell>
                  <Badge variant={match.status === 'finished' ? 'secondary' : 'default'} className={match.status === 'finished' ? '' : 'bg-yellow-500 text-black'}>
                    {match.status === 'finished' ? 'Finalizada' : 'Agendada'}
                  </Badge>
                </TableCell>
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

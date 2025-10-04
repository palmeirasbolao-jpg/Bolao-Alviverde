'use client';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { MoreHorizontal } from 'lucide-react';
import { useCollection, useFirestore, useMemoFirebase } from '@/firebase';
import { collection, query } from 'firebase/firestore';
import { Card } from '@/components/ui/card';

type Match = {
  id: string;
  matchDateTime: string;
  homeTeam: string;
  awayTeam: string;
  homeTeamScore?: number;
  awayTeamScore?: number;
};

export default function AdminMatchesPage() {
  const firestore = useFirestore();
  const matchesQuery = useMemoFirebase(
    () => (firestore ? query(collection(firestore, 'matches')) : null),
    [firestore]
  );
  const { data: matches, isLoading } = useCollection<Match>(matchesQuery);

  const getMatchStatus = (match: Match) => {
    const isFinished = typeof match.homeTeamScore === 'number' && typeof match.awayTeamScore === 'number';
    return isFinished ? 'finished' : 'scheduled';
  }

  return (
    <div className="container mx-auto">
      <div className="mb-8 flex justify-between items-center">
        <div>
          <h1 className="font-headline text-3xl font-bold">
            Gerenciar Partidas
          </h1>
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
            {isLoading && (
              <TableRow>
                <TableCell colSpan={5} className="text-center">
                  Carregando...
                </TableCell>
              </TableRow>
            )}
            {matches?.map((match) => {
              const status = getMatchStatus(match);
              return (
              <TableRow key={match.id}>
                <TableCell className="font-medium">
                  {match.homeTeam} vs {match.awayTeam}
                </TableCell>
                <TableCell>
                  {format(new Date(match.matchDateTime), 'dd/MM/yy HH:mm', {
                    locale: ptBR,
                  })}
                </TableCell>
                <TableCell className="font-bold">
                  {status === 'finished'
                    ? `${match.homeTeamScore} x ${match.awayTeamScore}`
                    : '-'}
                </TableCell>
                <TableCell>
                  <Badge
                    variant={status === 'finished' ? 'secondary' : 'default'}
                    className={
                      status === 'finished'
                        ? ''
                        : 'bg-yellow-500 text-black'
                    }
                  >
                    {status === 'finished' ? 'Finalizada' : 'Agendada'}
                  </Badge>
                </TableCell>
                <TableCell className="text-right">
                  <Button variant="ghost" size="icon">
                    <MoreHorizontal className="h-4 w-4" />
                  </Button>
                </TableCell>
              </TableRow>
            )})}
          </TableBody>
        </Table>
      </Card>
    </div>
  );
}
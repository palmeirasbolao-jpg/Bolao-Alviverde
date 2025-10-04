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
import { MoreHorizontal, Pen, PlusCircle, Trash } from 'lucide-react';
import { useCollection, useFirestore, useMemoFirebase } from '@/firebase';
import { collection, query } from 'firebase/firestore';
import { Card } from '@/components/ui/card';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { useState } from 'react';
import { MatchFormDialog } from '@/components/admin/match-form-dialog';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from '@/components/ui/alert-dialog';
import { deleteDocumentNonBlocking } from '@/firebase/non-blocking-updates';
import { doc } from 'firebase/firestore';
import { useToast } from '@/hooks/use-toast';

export type Match = {
  id: string;
  matchDateTime: string;
  homeTeam: string;
  awayTeam: string;
  homeTeamScore?: number;
  awayTeamScore?: number;
};

export default function AdminMatchesPage() {
  const firestore = useFirestore();
  const { toast } = useToast();
  const [dialogOpen, setDialogOpen] = useState(false);
  const [selectedMatch, setSelectedMatch] = useState<Match | null>(null);

  const matchesQuery = useMemoFirebase(
    () => (firestore ? query(collection(firestore, 'matches')) : null),
    [firestore]
  );
  const { data: matches, isLoading } = useCollection<Match>(matchesQuery);

  const getMatchStatus = (match: Match) => {
    const isFinished =
      typeof match.homeTeamScore === 'number' &&
      typeof match.awayTeamScore === 'number';
    return isFinished ? 'finished' : 'scheduled';
  };

  const handleAddClick = () => {
    setSelectedMatch(null);
    setDialogOpen(true);
  };

  const handleEditClick = (match: Match) => {
    setSelectedMatch(match);
    setDialogOpen(true);
  };
  
  const handleDelete = (matchId: string) => {
    if (!firestore) return;
    const matchDocRef = doc(firestore, 'matches', matchId);
    deleteDocumentNonBlocking(matchDocRef);
    toast({
      title: 'Partida removida',
      description: 'A partida foi removida com sucesso.',
    });
  }

  return (
    <>
      <MatchFormDialog
        isOpen={dialogOpen}
        onOpenChange={setDialogOpen}
        match={selectedMatch}
      />
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
          <Button onClick={handleAddClick}>
            <PlusCircle className="mr-2 h-4 w-4" />
            Adicionar Partida
          </Button>
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
                        variant={
                          status === 'finished' ? 'secondary' : 'default'
                        }
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
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button variant="ghost" size="icon">
                            <MoreHorizontal className="h-4 w-4" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent>
                          <DropdownMenuItem onClick={() => handleEditClick(match)}>
                            <Pen className="mr-2 h-4 w-4" />
                            Editar / Atualizar Placar
                          </DropdownMenuItem>
                          <AlertDialog>
                            <AlertDialogTrigger asChild>
                              <DropdownMenuItem onSelect={(e) => e.preventDefault()}>
                                <Trash className="mr-2 h-4 w-4" />
                                Remover
                              </DropdownMenuItem>
                            </AlertDialogTrigger>
                            <AlertDialogContent>
                              <AlertDialogHeader>
                                <AlertDialogTitle>Você tem certeza?</AlertDialogTitle>
                                <AlertDialogDescription>
                                  Essa ação não pode ser desfeita. Isso irá remover permanentemente a partida.
                                </AlertDialogDescription>
                              </AlertDialogHeader>
                              <AlertDialogFooter>
                                <AlertDialogCancel>Cancelar</AlertDialogCancel>
                                <AlertDialogAction onClick={() => handleDelete(match.id)}>Remover</AlertDialogAction>
                              </AlertDialogFooter>
                            </AlertDialogContent>
                          </AlertDialog>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </TableCell>
                  </TableRow>
                );
              })}
            </TableBody>
          </Table>
        </Card>
      </div>
    </>
  );
}

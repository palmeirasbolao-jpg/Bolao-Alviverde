'use client';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { MoreHorizontal, PlusCircle, Trash } from 'lucide-react';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { useCollection, useFirestore, useMemoFirebase } from '@/firebase';
import { collection, query, doc } from 'firebase/firestore';
import { Card } from '@/components/ui/card';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
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
import { useToast } from '@/hooks/use-toast';
import { useState } from 'react';
import { PlayerFormDialog } from '@/components/admin/player-form-dialog';

type Player = {
  id: string;
  email: string;
  teamName: string;
  initialScore: number;
  isAdmin: boolean;
};

export default function AdminPlayersPage() {
  const firestore = useFirestore();
  const { toast } = useToast();
  const [dialogOpen, setDialogOpen] = useState(false);

  const usersQuery = useMemoFirebase(
    () => (firestore ? query(collection(firestore, 'users')) : null),
    [firestore]
  );
  const { data: players, isLoading } = useCollection<Player>(usersQuery);

  const handleDelete = (playerId: string) => {
    if (!firestore) return;
    const playerDocRef = doc(firestore, 'users', playerId);
    deleteDocumentNonBlocking(playerDocRef);
    // Also remove from roles_admin if they are an admin
    const adminRoleDocRef = doc(firestore, 'roles_admin', playerId);
    deleteDocumentNonBlocking(adminRoleDocRef);

    toast({
      title: 'Jogador removido',
      description: 'O jogador foi removido com sucesso.',
    });
  };

  return (
    <>
      <PlayerFormDialog isOpen={dialogOpen} onOpenChange={setDialogOpen} />
      <div className="container mx-auto">
        <div className="mb-8 flex justify-between items-center">
          <div>
            <h1 className="font-headline text-3xl font-bold">
              Gerenciar Jogadores
            </h1>
            <p className="text-muted-foreground">
              Visualize, adicione e remova os participantes do bolão.
            </p>
          </div>
          <Button onClick={() => setDialogOpen(true)}>
            <PlusCircle className="mr-2 h-4 w-4" />
            Adicionar Jogador
          </Button>
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
              {isLoading && (
                <TableRow>
                  <TableCell colSpan={6} className="text-center">
                    Carregando...
                  </TableCell>
                </TableRow>
              )}
              {players?.map((player) => (
                <TableRow key={player.id}>
                  <TableCell className="font-medium">
                    <div className="flex items-center gap-3">
                      <Avatar>
                        <AvatarImage
                          src={`https://picsum.photos/seed/p${player.id}/100/100`}
                        />
                        <AvatarFallback>
                          {player.email.charAt(0).toUpperCase()}
                        </AvatarFallback>
                      </Avatar>
                      <span>{player.email}</span>
                    </div>
                  </TableCell>
                  <TableCell>{player.teamName}</TableCell>
                  <TableCell>{player.email}</TableCell>
                  <TableCell>
                    <Badge variant={player.isAdmin ? 'destructive' : 'outline'}>
                      {player.isAdmin ? 'admin' : 'player'}
                    </Badge>
                  </TableCell>
                  <TableCell className="text-right font-bold">
                    {player.initialScore}
                  </TableCell>
                  <TableCell className="text-right">
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button variant="ghost" size="icon">
                          <MoreHorizontal className="h-4 w-4" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent>
                        <AlertDialog>
                          <AlertDialogTrigger asChild>
                            <DropdownMenuItem
                              onSelect={(e) => e.preventDefault()}
                            >
                              <Trash className="mr-2 h-4 w-4" />
                              Remover
                            </DropdownMenuItem>
                          </AlertDialogTrigger>
                          <AlertDialogContent>
                            <AlertDialogHeader>
                              <AlertDialogTitle>
                                Você tem certeza?
                              </AlertDialogTitle>
                              <AlertDialogDescription>
                                Essa ação não pode ser desfeita. Isso irá
                                remover permanentemente o jogador e todos os
                                seus dados.
                              </AlertDialogDescription>
                            </AlertDialogHeader>
                            <AlertDialogFooter>
                              <AlertDialogCancel>Cancelar</AlertDialogCancel>
                              <AlertDialogAction
                                onClick={() => handleDelete(player.id)}
                              >
                                Remover
                              </AlertDialogAction>
                            </AlertDialogFooter>
                          </AlertDialogContent>
                        </AlertDialog>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </Card>
      </div>
    </>
  );
}

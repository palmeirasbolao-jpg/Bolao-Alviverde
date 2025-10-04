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
import { MoreHorizontal } from 'lucide-react';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { useCollection, useFirestore, useMemoFirebase } from '@/firebase';
import { collection, query } from 'firebase/firestore';
import { Card } from '@/components/ui/card';

type Player = {
  id: string;
  email: string;
  teamName: string;
  initialScore: number;
  isAdmin: boolean;
};

export default function AdminPlayersPage() {
  const firestore = useFirestore();
  const usersQuery = useMemoFirebase(
    () => (firestore ? query(collection(firestore, 'users')) : null),
    [firestore]
  );
  const { data: players, isLoading } = useCollection<Player>(usersQuery);

  return (
    <div className="container mx-auto">
      <div className="mb-8 flex justify-between items-center">
        <div>
          <h1 className="font-headline text-3xl font-bold">
            Gerenciar Jogadores
          </h1>
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
                      <AvatarFallback>{player.email.charAt(0).toUpperCase()}</AvatarFallback>
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
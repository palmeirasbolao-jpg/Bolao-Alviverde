'use client';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Avatar, AvatarFallback, AvatarImage } from '../ui/avatar';
import { Trophy } from 'lucide-react';
import { useCollection, useFirestore, useMemoFirebase } from '@/firebase';
import { collection, query, where, orderBy } from 'firebase/firestore';

type Player = {
  id: string;
  email: string;
  teamName: string;
  initialScore: number;
  isAdmin: boolean;
};

export function RankingTabs() {
  const firestore = useFirestore();

  const playersQuery = useMemoFirebase(
    () =>
      firestore
        ? query(
            collection(firestore, 'users'),
            where('isAdmin', '==', false),
            orderBy('initialScore', 'desc')
          )
        : null,
    [firestore]
  );

  const { data: players, isLoading } = useCollection<Player>(playersQuery);

  const getTrophyColor = (rank: number) => {
    if (rank === 0) return 'text-yellow-400'; // Gold
    if (rank === 1) return 'text-gray-400'; // Silver
    if (rank === 2) return 'text-yellow-700'; // Bronze
    return 'text-muted-foreground';
  };

  const renderRankingTable = (playerList: Player[] | null) => (
    <Table>
      <TableHeader>
        <TableRow>
          <TableHead className="w-[80px]">Pos.</TableHead>
          <TableHead>Jogador</TableHead>
          <TableHead>Time</TableHead>
          <TableHead className="text-right">Pontuação</TableHead>
        </TableRow>
      </TableHeader>
      <TableBody>
        {isLoading && (
          <TableRow>
            <TableCell colSpan={4} className="text-center">
              Carregando ranking...
            </TableCell>
          </TableRow>
        )}
        {playerList?.map((player, index) => (
          <TableRow key={player.id} className={index < 3 ? 'font-bold' : ''}>
            <TableCell className="text-lg">
              <div className="flex items-center gap-2">
                <Trophy className={`h-5 w-5 ${getTrophyColor(index)}`} />
                <span>{index + 1}</span>
              </div>
            </TableCell>
            <TableCell>
              <div className="flex items-center gap-3">
                <Avatar>
                  <AvatarImage
                    src={`https://picsum.photos/seed/${player.id}/100/100`}
                  />
                  <AvatarFallback>{player.email.charAt(0).toUpperCase()}</AvatarFallback>
                </Avatar>
                <span>{player.email}</span>
              </div>
            </TableCell>
            <TableCell>{player.teamName}</TableCell>
            <TableCell className="text-right text-lg">{player.initialScore}</TableCell>
          </TableRow>
        ))}
      </TableBody>
    </Table>
  );

  return (
    <Tabs defaultValue="geral">
      <TabsList className="grid w-full grid-cols-3 md:w-[400px]">
        <TabsTrigger value="geral">Geral</TabsTrigger>
        <TabsTrigger value="rodada">Rodada</TabsTrigger>
        <TabsTrigger value="mes">Mês</TabsTrigger>
      </TabsList>
      <TabsContent value="geral">{renderRankingTable(players)}</TabsContent>
      <TabsContent value="rodada">
        {/* Mocked data - in a real app, this would be filtered by round */}
        {renderRankingTable(players ? [...players].reverse() : [])}
      </TabsContent>
      <TabsContent value="mes">
        {/* Mocked data - in a real app, this would be filtered by month */}
        {renderRankingTable(players)}
      </TabsContent>
    </Tabs>
  );
}

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
import { collection, query, orderBy } from 'firebase/firestore';

type PublicPlayerProfile = {
  id: string;
  name: string;
  teamName: string;
  totalScore: number;
};

export function RankingTabs() {
  const firestore = useFirestore();

  // Query the public_profile collection which is safe to be read by all users
  const playersQuery = useMemoFirebase(
    () =>
      firestore
        ? query(
            collection(firestore, 'public_profile'),
            orderBy('totalScore', 'desc'),
          )
        : null,
    [firestore]
  );

  const { data: players, isLoading } = useCollection<PublicPlayerProfile>(playersQuery);

  const getTrophyColor = (rank: number) => {
    if (rank === 0) return 'text-yellow-400'; // Gold
    if (rank === 1) return 'text-gray-400'; // Silver
    if (rank === 2) return 'text-yellow-700'; // Bronze
    return 'text-muted-foreground';
  };
  
  const playerList = players;

  const renderRankingTable = (list: PublicPlayerProfile[] | undefined) => (
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
        {list?.map((player, index) => (
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
                  <AvatarFallback>{player.name ? player.name.charAt(0).toUpperCase() : '?'}</AvatarFallback>
                </Avatar>
                <span>{player.name}</span>
              </div>
            </TableCell>
            <TableCell>{player.teamName}</TableCell>
            <TableCell className="text-right text-lg">{player.totalScore}</TableCell>
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
      <TabsContent value="geral">{renderRankingTable(playerList)}</TabsContent>
      <TabsContent value="rodada">
        {/* Mocked data - in a real app, this would be filtered by round */}
        {renderRankingTable(playerList ? [...playerList].reverse() : [])}
      </TabsContent>
      <TabsContent value="mes">
        {/* Mocked data - in a real app, this would be filtered by month */}
        {renderRankingTable(playerList)}
      </TabsContent>
    </Tabs>
  );
}

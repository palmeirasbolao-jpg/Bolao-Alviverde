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

// Represents the public-facing data for the ranking.
type RankingProfile = {
  id: string;
  name: string;
  teamName: string;
  totalScore: number;
  monthlyScore: number;
  roundScore: number;
};

export function RankingTabs() {
  const firestore = useFirestore();

  // Query the public 'ranking' collection which is safe to be read by all users.
  const generalRankingQuery = useMemoFirebase(
    () =>
      firestore
        ? query(collection(firestore, 'ranking'), orderBy('totalScore', 'desc'))
        : null,
    [firestore]
  );
  const { data: generalRanking, isLoading: isLoadingGeneral } =
    useCollection<RankingProfile>(generalRankingQuery);

  const monthlyRankingQuery = useMemoFirebase(
    () =>
      firestore
        ? query(collection(firestore, 'ranking'), orderBy('monthlyScore', 'desc'))
        : null,
    [firestore]
  );
  const { data: monthlyRanking, isLoading: isLoadingMonthly } =
    useCollection<RankingProfile>(monthlyRankingQuery);
  
  const roundRankingQuery = useMemoFirebase(
    () =>
      firestore
        ? query(collection(firestore, 'ranking'), orderBy('roundScore', 'desc'))
        : null,
    [firestore]
  );
  const { data: roundRanking, isLoading: isLoadingRound } =
    useCollection<RankingProfile>(roundRankingQuery);


  const getTrophyColor = (rank: number) => {
    if (rank === 0) return 'text-yellow-400'; // Gold
    if (rank === 1) return 'text-gray-400'; // Silver
    if (rank === 2) return 'text-yellow-700'; // Bronze
    return 'text-muted-foreground';
  };

  const renderRankingTable = (
    list: RankingProfile[] | undefined,
    scoreField: keyof RankingProfile,
    isLoading: boolean
    ) => (
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
                  <AvatarFallback>
                    {player.name ? player.name.charAt(0).toUpperCase() : '?'}
                  </AvatarFallback>
                </Avatar>
                <span>{player.name}</span>
              </div>
            </TableCell>
            <TableCell>{player.teamName}</TableCell>
            <TableCell className="text-right text-lg">
              {String(player[scoreField])}
            </TableCell>
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
      <TabsContent value="geral">{renderRankingTable(generalRanking, 'totalScore', isLoadingGeneral)}</TabsContent>
      <TabsContent value="rodada">
        {renderRankingTable(roundRanking, 'roundScore', isLoadingRound)}
      </TabsContent>
      <TabsContent value="mes">
        {renderRankingTable(monthlyRanking, 'monthlyScore', isLoadingMonthly)}
      </TabsContent>
    </Tabs>
  );
}

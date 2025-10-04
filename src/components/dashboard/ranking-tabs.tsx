import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { players } from "@/lib/data";
import { Avatar, AvatarFallback, AvatarImage } from "../ui/avatar";
import { Trophy } from "lucide-react";

export function RankingTabs() {
  const sortedPlayers = [...players].sort((a, b) => b.score - a.score);

  const getTrophyColor = (rank: number) => {
    if (rank === 0) return "text-yellow-400"; // Gold
    if (rank === 1) return "text-gray-400"; // Silver
    if (rank === 2) return "text-yellow-700"; // Bronze
    return "text-muted-foreground";
  };
  
  const renderRankingTable = (playerList: typeof players) => (
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
          {playerList.filter(p => p.role === 'player').map((player, index) => (
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
                        <AvatarImage src={`https://picsum.photos/seed/${player.id}/100/100`} />
                        <AvatarFallback>{player.name.charAt(0)}</AvatarFallback>
                    </Avatar>
                    <span>{player.name}</span>
                </div>
              </TableCell>
              <TableCell>{player.teamName}</TableCell>
              <TableCell className="text-right text-lg">{player.score}</TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
  )

  return (
    <Tabs defaultValue="geral">
      <TabsList className="grid w-full grid-cols-3 md:w-[400px]">
        <TabsTrigger value="geral">Geral</TabsTrigger>
        <TabsTrigger value="rodada">Rodada</TabsTrigger>
        <TabsTrigger value="mes">Mês</TabsTrigger>
      </TabsList>
      <TabsContent value="geral">
       {renderRankingTable(sortedPlayers)}
      </TabsContent>
      <TabsContent value="rodada">
       {/* Mocked data - in a real app, this would be filtered by round */}
       {renderRankingTable(sortedPlayers.slice().reverse())}
      </TabsContent>
      <TabsContent value="mes">
       {/* Mocked data - in a real app, this would be filtered by month */}
       {renderRankingTable(sortedPlayers)}
      </TabsContent>
    </Tabs>
  );
}

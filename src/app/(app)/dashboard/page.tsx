'use client';
import { Button } from '@/components/ui/button';
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Separator } from '@/components/ui/separator';
import { useCollection, useFirestore, useMemoFirebase } from '@/firebase';
import { collection, query, where } from 'firebase/firestore';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';

type Match = {
  id: string;
  matchDateTime: string;
  homeTeam: string;
  awayTeam: string;
  homeTeamScore?: number;
  awayTeamScore?: number;
};

export default function DashboardPage() {
  const firestore = useFirestore();

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

  const upcomingMatches =
    matches?.filter((match) => getMatchStatus(match) === 'scheduled') ?? [];
  const finishedMatches =
    matches?.filter((match) => getMatchStatus(match) === 'finished') ?? [];

  return (
    <div className="container mx-auto">
      <div className="mb-8">
        <h1 className="font-headline text-3xl font-bold">Meus Palpites</h1>
        <p className="text-muted-foreground">
          Insira seus palpites para as próximas partidas do Verdão.
        </p>
      </div>

      <div className="grid gap-8">
        <section>
          <h2 className="font-headline text-2xl font-semibold mb-4">
            Próximas Partidas
          </h2>
          {isLoading && <p>Carregando partidas...</p>}
          <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
            {upcomingMatches.map((match) => (
              <Card key={match.id}>
                <CardHeader>
                  <CardTitle className="flex justify-between items-center text-lg">
                    <span>
                      {match.homeTeam} vs {match.awayTeam}
                    </span>
                  </CardTitle>
                  <CardDescription>
                    {format(new Date(match.matchDateTime), "dd 'de' MMMM 'às' HH:mm", {
                      locale: ptBR,
                    })}
                  </CardDescription>
                </CardHeader>
                <CardContent className="flex items-center justify-center gap-4">
                  <Input
                    type="number"
                    min="0"
                    className="w-16 text-center text-2xl font-bold"
                    placeholder="0"
                  />
                  <span className="text-2xl font-bold text-muted-foreground">
                    x
                  </span>
                  <Input
                    type="number"
                    min="0"
                    className="w-16 text-center text-2xl font-bold"
                    placeholder="0"
                  />
                </CardContent>
                <CardFooter>
                  <Button className="w-full font-bold">Salvar Palpite</Button>
                </CardFooter>
              </Card>
            ))}
          </div>
        </section>

        <Separator />

        <section>
          <h2 className="font-headline text-2xl font-semibold mb-4">
            Resultados Anteriores
          </h2>
          {isLoading && <p>Carregando resultados...</p>}
          <div className="space-y-4">
            {finishedMatches.map((match) => (
              <Card key={match.id} className="p-4">
                <div className="flex items-center justify-between">
                  <div className="text-sm text-muted-foreground">
                    {format(new Date(match.matchDateTime), 'dd/MM/yyyy', {
                      locale: ptBR,
                    })}
                  </div>
                  <div className="flex items-center gap-4 font-bold text-lg">
                    <span>{match.homeTeam}</span>
                    <span className="text-primary">{match.homeTeamScore}</span>
                    <span>x</span>
                    <span className="text-primary">{match.awayTeamScore}</span>
                    <span>{match.awayTeam}</span>
                  </div>
                  {/* This part needs guess data to be implemented */}
                  <div className="text-sm text-green-600 font-bold">
                    +5 Pontos
                  </div>
                </div>
              </Card>
            ))}
          </div>
        </section>
      </div>
    </div>
  );
}

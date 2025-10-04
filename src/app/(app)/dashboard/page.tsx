'use client';
import {
  Card,
  CardContent,
} from '@/components/ui/card';
import { Separator } from '@/components/ui/separator';
import { useCollection, useFirestore, useUser, useMemoFirebase } from '@/firebase';
import { collection, query, orderBy } from 'firebase/firestore';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { GuessCard } from '@/components/dashboard/guess-card';

type Match = {
  id: string;
  matchDateTime: string;
  homeTeam: string;
  awayTeam: string;
  homeTeamScore?: number;
  awayTeamScore?: number;
};

type Guess = {
  id: string; // Corresponds to matchId
  homeTeamGuess: number;
  awayTeamGuess: number;
  pointsAwarded: number;
};

export default function DashboardPage() {
  const firestore = useFirestore();
  const { user } = useUser();

  const matchesQuery = useMemoFirebase(
    () =>
      firestore
        ? query(collection(firestore, 'matches'), orderBy('matchDateTime', 'desc'))
        : null,
    [firestore]
  );
  const { data: matches, isLoading: isLoadingMatches } = useCollection<Match>(matchesQuery);
  
  const guessesQuery = useMemoFirebase(
    () => (firestore && user ? query(collection(firestore, 'users', user.uid, 'guesses')) : null),
    [firestore, user]
  );
  const { data: guesses, isLoading: isLoadingGuesses } = useCollection<Guess>(guessesQuery);
  
  const guessesMap = useMemoFirebase(() => 
    guesses?.reduce((acc, guess) => {
      acc[guess.id] = guess;
      return acc;
    }, {} as Record<string, Guess>)
  , [guesses]);

  const getMatchStatus = (match: Match) => {
    const isFinished =
      typeof match.homeTeamScore === 'number' &&
      typeof match.awayTeamScore === 'number';
    return isFinished ? 'finished' : 'scheduled';
  };

  const upcomingMatches =
    matches
      ?.filter((match) => getMatchStatus(match) === 'scheduled')
      .sort((a, b) => new Date(a.matchDateTime).getTime() - new Date(b.matchDateTime).getTime()) ?? [];

  const finishedMatches =
    matches?.filter((match) => getMatchStatus(match) === 'finished') ?? [];

  const isLoading = isLoadingMatches || isLoadingGuesses;

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
          {!isLoading && upcomingMatches.length === 0 && <p>Nenhuma partida agendada no momento.</p>}
          <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
            {upcomingMatches.map((match) => (
              <GuessCard key={match.id} match={match} initialGuess={guessesMap?.[match.id]} />
            ))}
          </div>
        </section>

        <Separator />

        <section>
          <h2 className="font-headline text-2xl font-semibold mb-4">
            Resultados Anteriores
          </h2>
          {isLoading && <p>Carregando resultados...</p>}
           {!isLoading && finishedMatches.length === 0 && <p>Nenhum resultado anterior.</p>}
          <div className="space-y-4">
            {finishedMatches.map((match) => {
              const userGuess = guessesMap?.[match.id];
              return (
                <Card key={match.id} className="p-4">
                  <div className="grid grid-cols-3 items-center text-center sm:grid-cols-4">
                    <div className="text-sm text-muted-foreground text-left sm:text-center">
                      {format(new Date(match.matchDateTime), 'dd/MM/yy', {
                        locale: ptBR,
                      })}
                    </div>
                    <div className="flex items-center justify-center gap-2 font-bold text-base sm:gap-4 sm:text-lg">
                      <span>{match.homeTeam}</span>
                      <span className="text-primary">{match.homeTeamScore}</span>
                      <span>x</span>
                      <span className="text-primary">{match.awayTeamScore}</span>
                      <span>{match.awayTeam}</span>
                    </div>
                    
                    <div className="text-sm text-muted-foreground">
                      Seu palpite: {userGuess ? `${userGuess.homeTeamGuess} x ${userGuess.awayTeamGuess}` : 'N/A'}
                    </div>

                    {userGuess && (typeof userGuess.pointsAwarded === 'number') && (
                       <div className="text-sm text-green-600 font-bold justify-self-end">
                        +{userGuess.pointsAwarded} Pontos
                      </div>
                    )}
                  </div>
                </Card>
              )
            })}
          </div>
        </section>
      </div>
    </div>
  );
}

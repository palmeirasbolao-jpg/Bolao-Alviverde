'use client';

import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { useState } from 'react';
import { useFirestore, useUser, setDocumentNonBlocking } from '@/firebase';
import { doc } from 'firebase/firestore';
import { useToast } from '@/hooks/use-toast';
import { Loader2 } from 'lucide-react';

type Match = {
  id: string;
  matchDateTime: string;
  homeTeam: string;
  awayTeam: string;
};

type Guess = {
  homeTeamGuess: number;
  awayTeamGuess: number;
};

type GuessCardProps = {
  match: Match;
  initialGuess?: Guess | null;
};

export function GuessCard({ match, initialGuess }: GuessCardProps) {
  const { user } = useUser();
  const firestore = useFirestore();
  const { toast } = useToast();
  const [isLoading, setIsLoading] = useState(false);
  const [homeGuess, setHomeGuess] = useState<string>(
    initialGuess?.homeTeamGuess?.toString() ?? ''
  );
  const [awayGuess, setAwayGuess] = useState<string>(
    initialGuess?.awayTeamGuess?.toString() ?? ''
  );

  const handleSaveGuess = async () => {
    if (!user) {
      toast({
        variant: 'destructive',
        title: 'Erro',
        description: 'Você precisa estar logado para salvar um palpite.',
      });
      return;
    }

    const homeScore = parseInt(homeGuess, 10);
    const awayScore = parseInt(awayGuess, 10);

    if (isNaN(homeScore) || isNaN(awayScore) || homeScore < 0 || awayScore < 0) {
      toast({
        variant: 'destructive',
        title: 'Palpite inválido',
        description: 'Por favor, insira um placar válido (números inteiros e não negativos).',
      });
      return;
    }

    setIsLoading(true);
    
    // The guessId will be the matchId to ensure one guess per user per match
    const guessDocRef = doc(firestore, 'users', user.uid, 'guesses', match.id);

    const guessData = {
      id: match.id, // Using matchId as guessId
      userId: user.uid,
      matchId: match.id,
      homeTeamGuess: homeScore,
      awayTeamGuess: awayScore,
      pointsAwarded: initialGuess ? (initialGuess as any).pointsAwarded || 0 : 0,
    };
    
    setDocumentNonBlocking(guessDocRef, guessData, { merge: true });

    // Using a timeout to give a feeling of async operation and let the user see the loading
    setTimeout(() => {
      toast({
        title: 'Palpite Salvo!',
        description: `Seu palpite para ${match.homeTeam} vs ${match.awayTeam} foi salvo.`,
      });
      setIsLoading(false);
    }, 1000);

  };

  return (
    <Card>
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
          value={homeGuess}
          onChange={(e) => setHomeGuess(e.target.value)}
          disabled={isLoading}
        />
        <span className="text-2xl font-bold text-muted-foreground">x</span>
        <Input
          type="number"
          min="0"
          className="w-16 text-center text-2xl font-bold"
          placeholder="0"
          value={awayGuess}
          onChange={(e) => setAwayGuess(e.target.value)}
          disabled={isLoading}
        />
      </CardContent>
      <CardFooter>
        <Button className="w-full font-bold" onClick={handleSaveGuess} disabled={isLoading}>
          {isLoading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : 'Salvar Palpite'}
        </Button>
      </CardFooter>
    </Card>
  );
}

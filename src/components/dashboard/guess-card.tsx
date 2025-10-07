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
import { useEffect, useState } from 'react';
import { useFirestore, useUser, setDocumentNonBlocking } from '@/firebase';
import { doc } from 'firebase/firestore';
import { useToast } from '@/hooks/use-toast';
import { Loader2, Timer } from 'lucide-react';
import { CountdownTimer } from './countdown-timer';
import { cn } from '@/lib/utils';

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
  isNextMatch?: boolean;
};

export function GuessCard({ match, initialGuess, isNextMatch = false }: GuessCardProps) {
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
  const [isLocked, setIsLocked] = useState(false);

  const matchDate = new Date(match.matchDateTime);

  useEffect(() => {
    // Check if the match is less than 1 hour away
    const oneHour = 60 * 60 * 1000;
    const now = new Date();
    if (matchDate.getTime() - now.getTime() < oneHour) {
      setIsLocked(true);
    }
  }, [matchDate]);


  const handleSaveGuess = async () => {
    if (!user) {
      toast({
        variant: 'destructive',
        title: 'Erro',
        description: 'Você precisa estar logado para salvar um palpite.',
      });
      return;
    }
    
    if (isLocked) {
       toast({
        variant: 'destructive',
        title: 'Tempo Esgotado',
        description: 'Não é mais possível palpitar para esta partida.',
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
    
    const guessDocRef = doc(firestore, 'users', user.uid, 'guesses', match.id);

    const guessData = {
      id: match.id,
      userId: user.uid,
      matchId: match.id,
      homeTeamGuess: homeScore,
      awayTeamGuess: awayScore,
      pointsAwarded: initialGuess ? (initialGuess as any).pointsAwarded || 0 : 0,
    };
    
    setDocumentNonBlocking(guessDocRef, guessData, { merge: true });

    setTimeout(() => {
      toast({
        title: 'Palpite Salvo!',
        description: `Seu palpite para ${match.homeTeam} vs ${match.awayTeam} foi salvo.`,
      });
      setIsLoading(false);
    }, 1000);

  };
  
  const handleLockUpdate = (locked: boolean) => {
    setIsLocked(locked);
  }

  return (
    <Card className={cn("flex flex-col", isLocked ? "bg-muted/50" : "")}>
      <CardHeader>
        <CardTitle className="flex justify-between items-center text-lg">
          <span>
            {match.homeTeam} vs {match.awayTeam}
          </span>
        </CardTitle>
        <CardDescription>
          {format(matchDate, "dd 'de' MMMM 'às' HH:mm", {
            locale: ptBR,
          })}
        </CardDescription>
         {isNextMatch && (
          <div className="flex items-center text-sm text-amber-600 dark:text-amber-500 font-medium pt-2">
            <Timer className="mr-2 h-4 w-4" />
            <CountdownTimer targetDate={match.matchDateTime} onLockUpdate={handleLockUpdate} />
          </div>
        )}
      </CardHeader>
      <CardContent className="flex items-center justify-center gap-4 flex-grow">
       {isLocked ? (
          <div className='text-center font-semibold text-destructive'>
            Palpites encerrados!
          </div>
        ) : (
          <>
            <Input
              type="number"
              min="0"
              className="w-16 text-center text-2xl font-bold"
              placeholder="0"
              value={homeGuess}
              onChange={(e) => setHomeGuess(e.target.value)}
              disabled={isLoading || isLocked}
            />
            <span className="text-2xl font-bold text-muted-foreground">x</span>
            <Input
              type="number"
              min="0"
              className="w-16 text-center text-2xl font-bold"
              placeholder="0"
              value={awayGuess}
              onChange={(e) => setAwayGuess(e.target.value)}
              disabled={isLoading || isLocked}
            />
          </>
        )}
      </CardContent>
      <CardFooter>
        <Button className="w-full font-bold" onClick={handleSaveGuess} disabled={isLoading || isLocked}>
          {isLoading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : 'Salvar Palpite'}
        </Button>
      </CardFooter>
    </Card>
  );
}

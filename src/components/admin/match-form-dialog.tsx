'use client';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover';
import { CalendarIcon, Loader2 } from 'lucide-react';
import { Calendar } from '@/components/ui/calendar';
import { zodResolver } from '@hookform/resolvers/zod';
import { useForm } from 'react-hook-form';
import * as z from 'zod';
import { cn } from '@/lib/utils';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { useEffect, useState } from 'react';
import { useFirestore } from '@/firebase';
import {
  addDocumentNonBlocking,
  setDocumentNonBlocking,
  updateDocumentNonBlocking,
} from '@/firebase/non-blocking-updates';
import {
  collection,
  doc,
  getDocs,
  query,
  runTransaction,
  serverTimestamp,
  where,
} from 'firebase/firestore';
import { useToast } from '@/hooks/use-toast';
import type { Match } from '@/app/(app)/admin/matches/page';

const formSchema = z.object({
  homeTeam: z.string().min(1, 'Time da casa é obrigatório.'),
  awayTeam: z.string().min(1, 'Time visitante é obrigatório.'),
  matchDateTime: z.date({ required_error: 'Data e hora são obrigatórios.' }),
  homeTeamScore: z.coerce.number().optional(),
  awayTeamScore: z.coerce.number().optional(),
});

type MatchFormDialogProps = {
  isOpen: boolean;
  onOpenChange: (open: boolean) => void;
  match: Match | null;
};

export function MatchFormDialog({
  isOpen,
  onOpenChange,
  match,
}: MatchFormDialogProps) {
  const firestore = useFirestore();
  const { toast } = useToast();
  const [isLoading, setIsLoading] = useState(false);
  const isEditing = !!match;

  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      homeTeam: 'Palmeiras',
    },
  });

  useEffect(() => {
    if (match) {
      form.reset({
        homeTeam: match.homeTeam,
        awayTeam: match.awayTeam,
        matchDateTime: new Date(match.matchDateTime),
        homeTeamScore: match.homeTeamScore ?? undefined,
        awayTeamScore: match.awayTeamScore ?? undefined,
      });
    } else {
      form.reset({
        homeTeam: 'Palmeiras',
        awayTeam: '',
        matchDateTime: undefined,
        homeTeamScore: undefined,
        awayTeamScore: undefined,
      });
    }
  }, [match, form]);

  const calculatePoints = (
    homeResult: number,
    awayResult: number,
    homeGuess: number,
    awayGuess: number
  ) => {
    // Exact score
    if (homeResult === homeGuess && awayResult === awayGuess) {
      return 10;
    }

    const resultWinner = homeResult > awayResult ? 'home' : homeResult < awayResult ? 'away' : 'draw';
    const guessWinner = homeGuess > awayGuess ? 'home' : homeGuess < awayGuess ? 'away' : 'draw';
    
    // Guessed winner and goal difference
    if (resultWinner === guessWinner && resultWinner !== 'draw' && (homeResult - awayResult === homeGuess - awayGuess)) {
      return 5;
    }
    
    // Guessed winner or guessed a draw (but not exact score)
    if (resultWinner === guessWinner) {
      return 3;
    }

    return 0;
  };

  async function processScoreUpdate(matchId: string, finalHomeScore: number, finalAwayScore: number) {
    if (!firestore) return;
    
    try {
      await runTransaction(firestore, async (transaction) => {
        const usersSnapshot = await getDocs(collection(firestore, 'users'));
        
        for (const userDoc of usersSnapshot.docs) {
          const guessDocRef = doc(firestore, 'users', userDoc.id, 'guesses', matchId);
          const guessDoc = await transaction.get(guessDocRef);

          if (guessDoc.exists()) {
            const guessData = guessDoc.data();
            const points = calculatePoints(finalHomeScore, finalAwayScore, guessData.homeTeamGuess, guessData.awayTeamGuess);
            
            // Update points for the guess
            transaction.update(guessDocRef, { pointsAwarded: points });

            // Update total user score
            const userDocRef = doc(firestore, 'users', userDoc.id);
            const currentUserDoc = await transaction.get(userDocRef);
            if(currentUserDoc.exists()) {
              const currentScore = currentUserDoc.data().initialScore || 0;
              // This should be idempotent, so we subtract previous points if they exist
              const previousPoints = guessData.pointsAwarded || 0;
              transaction.update(userDocRef, { initialScore: currentScore - previousPoints + points });
            }
          }
        }
      });
       toast({
        title: "Pontuações atualizadas!",
        description: "As pontuações de todos os jogadores foram calculadas e atualizadas.",
      });
    } catch (e) {
      console.error("Transaction failed: ", e);
      toast({
        variant: "destructive",
        title: "Erro ao atualizar pontuações",
        description: "Não foi possível calcular e atualizar as pontuações dos jogadores.",
      });
    }
  }


  async function onSubmit(values: z.infer<typeof formSchema>) {
    if (!firestore) return;
    setIsLoading(true);

    const hasScore = typeof values.homeTeamScore === 'number' && typeof values.awayTeamScore === 'number';
    
    const matchData = {
      ...values,
      matchDateTime: values.matchDateTime.toISOString(),
      ...(hasScore && { homeTeamScore: values.homeTeamScore, awayTeamScore: values.awayTeamScore }),
    };

    if (isEditing) {
      const matchDocRef = doc(firestore, 'matches', match!.id);
      setDocumentNonBlocking(matchDocRef, matchData, { merge: true });

      // If score was updated, trigger points calculation
      if (hasScore) {
        await processScoreUpdate(match!.id, values.homeTeamScore!, values.awayTeamScore!);
      }
    } else {
      const matchesColRef = collection(firestore, 'matches');
      await addDocumentNonBlocking(matchesColRef, matchData);
    }

    toast({
      title: `Partida ${isEditing ? 'atualizada' : 'adicionada'}!`,
      description: `A partida foi ${
        isEditing ? 'atualizada' : 'salva'
      } com sucesso.`,
    });

    setIsLoading(false);
    onOpenChange(false);
  }

  return (
    <Dialog open={isOpen} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>
            {isEditing ? 'Editar Partida' : 'Adicionar Nova Partida'}
          </DialogTitle>
          <DialogDescription>
            {isEditing
              ? 'Atualize os detalhes ou o placar final da partida.'
              : 'Preencha os detalhes da nova partida.'}
          </DialogDescription>
        </DialogHeader>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            <FormField
              control={form.control}
              name="matchDateTime"
              render={({ field }) => (
                <FormItem className="flex flex-col">
                  <FormLabel>Data e Hora da Partida</FormLabel>
                  <Popover>
                    <PopoverTrigger asChild>
                      <FormControl>
                        <Button
                          variant={'outline'}
                          className={cn(
                            'w-full pl-3 text-left font-normal',
                            !field.value && 'text-muted-foreground'
                          )}
                        >
                          {field.value ? (
                            format(field.value, 'dd/MM/yyyy HH:mm', {
                              locale: ptBR,
                            })
                          ) : (
                            <span>Escolha uma data</span>
                          )}
                          <CalendarIcon className="ml-auto h-4 w-4 opacity-50" />
                        </Button>
                      </FormControl>
                    </PopoverTrigger>
                    <PopoverContent className="w-auto p-0" align="start">
                      <Calendar
                        mode="single"
                        selected={field.value}
                        onSelect={field.onChange}
                        disabled={(date) => date < new Date('1900-01-01')}
                        initialFocus
                      />
                       <div className="p-3 border-t border-border">
                        <Input
                          type="time"
                          defaultValue={field.value ? format(field.value, 'HH:mm') : ''}
                          onChange={(e) => {
                            const [hours, minutes] = e.target.value.split(':').map(Number);
                            const newDate = new Date(field.value || new Date());
                            newDate.setHours(hours, minutes);
                            field.onChange(newDate);
                          }}
                        />
                      </div>
                    </PopoverContent>
                  </Popover>
                  <FormMessage />
                </FormItem>
              )}
            />
            <div className="flex items-center gap-4">
              <FormField
                control={form.control}
                name="homeTeam"
                render={({ field }) => (
                  <FormItem className="flex-1">
                    <FormLabel>Time da Casa</FormLabel>
                    <FormControl>
                      <Input {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="awayTeam"
                render={({ field }) => (
                  <FormItem className="flex-1">
                    <FormLabel>Time Visitante</FormLabel>
                    <FormControl>
                      <Input {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>
            {isEditing && (
              <div className="flex items-center gap-4">
                <FormField
                  control={form.control}
                  name="homeTeamScore"
                  render={({ field }) => (
                    <FormItem className="flex-1">
                      <FormLabel>Gols (Casa)</FormLabel>
                      <FormControl>
                        <Input type="number" min="0" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <span className="pt-8 font-bold">x</span>
                <FormField
                  control={form.control}
                  name="awayTeamScore"
                  render={({ field }) => (
                    <FormItem className="flex-1">
                      <FormLabel>Gols (Visitante)</FormLabel>
                      <FormControl>
                        <Input type="number" min="0" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>
            )}
            <DialogFooter>
              <Button type="submit" disabled={isLoading}>
                {isLoading && (
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                )}
                Salvar
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}

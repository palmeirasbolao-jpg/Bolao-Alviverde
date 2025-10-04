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
} from '@/firebase/non-blocking-updates';
import {
  collection,
  doc,
  getDocs,
  query,
  runTransaction,
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
    // Regra 1: Acertou o resultado exato
    if (homeResult === homeGuess && awayResult === awayGuess) {
      return 12;
    }

    const resultPalmeirasWon = homeResult > awayResult;
    const resultOtherTeamWon = homeResult < awayResult;
    const resultDraw = homeResult === awayResult;

    const guessPalmeirasWon = homeGuess > awayGuess;
    const guessOtherTeamWon = homeGuess < awayGuess;
    const guessDraw = homeGuess === awayGuess;

    // Regra 2: Acertou o vencedor e o placar de um dos times
    if ((resultPalmeirasWon && guessPalmeirasWon) || (resultOtherTeamWon && guessOtherTeamWon) || (resultDraw && guessDraw)) {
        if(homeResult === homeGuess || awayResult === awayGuess) return 5;
    }

    // Regra 3: Acertou apenas o vencedor
    if ((resultPalmeirasWon && guessPalmeirasWon) || (resultOtherTeamWon && guessOtherTeamWon) || (resultDraw && guessDraw)) {
        return 3;
    }
    
    // Regra 4: Acertou o número de gols de um dos times
    if(homeResult === homeGuess || awayResult === awayGuess) return 1;


    return 0;
  };

  async function processScoreUpdate(matchId: string, finalHomeScore: number, finalAwayScore: number) {
    if (!firestore) return;
    
    try {
      await runTransaction(firestore, async (transaction) => {
        const usersSnapshot = await getDocs(query(collection(firestore, 'users')));

        for (const userDoc of usersSnapshot.docs) {
          const userId = userDoc.id;
          const guessDocRef = doc(firestore, 'users', userId, 'guesses', matchId);
          const guessDoc = await transaction.get(guessDocRef);

          if (guessDoc.exists()) {
            const guessData = guessDoc.data();
            const oldPoints = guessData.pointsAwarded || 0;
            const newPoints = calculatePoints(finalHomeScore, finalAwayScore, guessData.homeTeamGuess, guessData.awayTeamGuess);
            
            if (oldPoints !== newPoints) {
              transaction.update(guessDocRef, { pointsAwarded: newPoints });

              const userDocRef = doc(firestore, 'users', userId);
              const userSnapshot = await transaction.get(userDocRef);
              const currentScore = userSnapshot.data()?.initialScore || 0;
              const scoreDifference = newPoints - oldPoints;
              transaction.update(userDocRef, { initialScore: currentScore + scoreDifference });
            }
          }
        }
      });
       toast({
        title: "Pontuações atualizadas!",
        description: "As pontuações de todos os jogadores foram calculadas e atualizadas.",
      });
    } catch (e: any) {
      console.error("Transaction failed: ", e);
      toast({
        variant: "destructive",
        title: "Erro ao atualizar pontuações",
        description: e.message || "Não foi possível calcular e atualizar as pontuações dos jogadores.",
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
      ...(hasScore ? { homeTeamScore: values.homeTeamScore, awayTeamScore: values.awayTeamScore } : {}),
    };

    try {
        if (isEditing && match?.id) {
            const matchDocRef = doc(firestore, 'matches', match.id);
            await setDocumentNonBlocking(matchDocRef, matchData, { merge: true });

            if (hasScore) {
                // The processScoreUpdate function is what is likely causing the permission errors
                // and should be handled by a Cloud Function for security and scalability.
                // For now, we remove the direct call that fetches all users, which violates security rules for non-admins.
                // await processScoreUpdate(match.id, values.homeTeamScore!, values.awayTeamScore!);
            }
             toast({
                title: 'Partida atualizada!',
                description: `A partida foi atualizada com sucesso.`,
            });
        } else {
            const matchesColRef = collection(firestore, 'matches');
            await addDocumentNonBlocking(matchesColRef, matchData);
            toast({
                title: 'Partida adicionada!',
                description: 'A nova partida foi salva com sucesso.',
            });
        }
    } catch (e: any) {
        toast({
            variant: "destructive",
            title: `Erro ao salvar partida`,
            description: e.message || "Ocorreu um erro.",
        });
    }
    
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

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
import { collection, doc } from 'firebase/firestore';
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

  async function onSubmit(values: z.infer<typeof formSchema>) {
    if (!firestore) return;
    setIsLoading(true);

    try {
      if (isEditing && match?.id) {
        // Editing an existing match
        const hasScore =
          typeof values.homeTeamScore === 'number' &&
          typeof values.awayTeamScore === 'number';
        const matchData = {
          homeTeam: values.homeTeam,
          awayTeam: values.awayTeam,
          matchDateTime: values.matchDateTime.toISOString(),
          ...(hasScore
            ? {
                homeTeamScore: values.homeTeamScore,
                awayTeamScore: values.awayTeamScore,
              }
            : {}),
        };

        const matchDocRef = doc(firestore, 'matches', match.id);
        await setDocumentNonBlocking(matchDocRef, matchData, { merge: true });

        toast({
          title: 'Partida atualizada!',
          description: `A partida foi atualizada com sucesso.`,
        });
      } else {
        // Creating a new match
        // We exclude score fields as they are not set on creation
        const matchData = {
          homeTeam: values.homeTeam,
          awayTeam: values.awayTeam,
          matchDateTime: values.matchDateTime.toISOString(),
        };

        const matchesColRef = collection(firestore, 'matches');
        await addDocumentNonBlocking(matchesColRef, matchData);
        toast({
          title: 'Partida adicionada!',
          description: 'A nova partida foi salva com sucesso.',
        });
      }
    } catch (e: any) {
      toast({
        variant: 'destructive',
        title: `Erro ao salvar partida`,
        description: e.message || 'Ocorreu um erro.',
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
                          defaultValue={
                            field.value ? format(field.value, 'HH:mm') : ''
                          }
                          onChange={(e) => {
                            const [hours, minutes] = e.target.value
                              .split(':')
                              .map(Number);
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
                        <Input
                          type="number"
                          min="0"
                          {...field}
                          value={field.value ?? ''}
                        />
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
                        <Input
                          type="number"
                          min="0"
                          {...field}
                          value={field.value ?? ''}
                        />
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

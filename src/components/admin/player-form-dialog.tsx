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
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { zodResolver } from '@hookform/resolvers/zod';
import { useForm } from 'react-hook-form';
import * as z from 'zod';
import { useEffect, useState } from 'react';
import {
  useAuth,
  useFirestore,
  setDocumentNonBlocking,
} from '@/firebase';
import { createUserWithEmailAndPassword, updateProfile } from 'firebase/auth';
import { doc } from 'firebase/firestore';
import { useToast } from '@/hooks/use-toast';
import { Loader2 } from 'lucide-react';
import { Switch } from '../ui/switch';
import type { Player } from '@/app/(app)/admin/players/page';

const formSchema = z.object({
  name: z.string().min(3, {
    message: 'O nome deve ter pelo menos 3 caracteres.',
  }),
  email: z.string().email({
    message: 'Por favor, insira um e-mail válido.',
  }),
  password: z.string().optional(),
  teamName: z.string().min(3, {
    message: 'O nome do time deve ter pelo menos 3 caracteres.',
  }),
  initialScore: z.coerce.number().min(0, 'A pontuação não pode ser negativa.'),
  isAdmin: z.boolean().default(false),
});

type PlayerFormDialogProps = {
  isOpen: boolean;
  onOpenChange: (open: boolean) => void;
  player: Player | null;
};

export function PlayerFormDialog({
  isOpen,
  onOpenChange,
  player,
}: PlayerFormDialogProps) {
  const auth = useAuth();
  const firestore = useFirestore();
  const { toast } = useToast();
  const [isLoading, setIsLoading] = useState(false);
  const isEditing = !!player;

  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      name: '',
      email: '',
      password: '',
      teamName: '',
      initialScore: 0,
      isAdmin: false,
    },
  });

  useEffect(() => {
    if (isOpen) {
      if (isEditing && player) {
        form.reset({
          name: player.name,
          email: player.email,
          teamName: player.teamName,
          initialScore: player.initialScore,
          isAdmin: player.isAdmin,
          password: '', // Password is not fetched, leave empty
        });
      } else {
        form.reset({
          name: '',
          email: '',
          password: '',
          teamName: '',
          initialScore: 0,
          isAdmin: false,
        });
      }
    }
  }, [isOpen, isEditing, player, form]);

  async function onSubmit(values: z.infer<typeof formSchema>) {
    if (!firestore) return;
    setIsLoading(true);

    try {
      if (isEditing && player) {
        // Editing existing player
        const userDocRef = doc(firestore, 'users', player.id);
        const userData = {
          name: values.name,
          email: values.email,
          teamName: values.teamName,
          initialScore: values.initialScore,
          isAdmin: values.isAdmin,
        };
        setDocumentNonBlocking(userDocRef, userData, { merge: true });

        const adminRoleDocRef = doc(firestore, 'roles_admin', player.id);
        if (values.isAdmin) {
          setDocumentNonBlocking(
            adminRoleDocRef,
            { userId: player.id },
            { merge: true }
          );
        } else {
          // If toggled off, remove admin role
          setDocumentNonBlocking(adminRoleDocRef, {}, { merge: false });
        }
        
        toast({
          title: 'Jogador atualizado!',
          description: `Os dados de ${values.name} foram salvos.`,
        });

      } else {
        // Creating new player
        if (!values.password || values.password.length < 6) {
           toast({
            variant: 'destructive',
            title: 'Senha necessária',
            description: 'A senha deve ter pelo menos 6 caracteres.',
          });
          setIsLoading(false);
          return;
        }

        const userCredential = await createUserWithEmailAndPassword(
          auth,
          values.email,
          values.password
        );
        const user = userCredential.user;

        if (user) {
          await updateProfile(user, { displayName: values.name });
          const userDocRef = doc(firestore, 'users', user.uid);
          const userData = {
            id: user.uid,
            name: values.name,
            email: values.email,
            teamName: values.teamName,
            initialScore: values.initialScore,
            isAdmin: values.isAdmin,
          };
          setDocumentNonBlocking(userDocRef, userData, { merge: true });

          if (values.isAdmin) {
            const adminRoleDocRef = doc(firestore, 'roles_admin', user.uid);
            setDocumentNonBlocking(
              adminRoleDocRef,
              { userId: user.uid },
              { merge: true }
            );
          }
        }
        toast({
          title: 'Jogador adicionado!',
          description: `O jogador ${values.name} foi criado com sucesso.`,
        });
      }
      onOpenChange(false);
    } catch (error: any) {
      toast({
        variant: 'destructive',
        title: `Erro ao ${isEditing ? 'editar' : 'criar'} jogador`,
        description:
          error.message ||
          `Ocorreu um erro ao tentar ${isEditing ? 'editar' : 'criar'} o jogador.`,
      });
    } finally {
      setIsLoading(false);
    }
  }

  return (
    <Dialog open={isOpen} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>{isEditing ? 'Editar Jogador' : 'Adicionar Novo Jogador'}</DialogTitle>
          <DialogDescription>
            {isEditing
              ? 'Altere os dados do jogador.'
              : 'Preencha os detalhes para criar uma nova conta.'}
          </DialogDescription>
        </DialogHeader>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            <FormField
              control={form.control}
              name="name"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Nome</FormLabel>
                  <FormControl>
                    <Input placeholder="Nome do Jogador" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
             <FormField
              control={form.control}
              name="teamName"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Nome do Time</FormLabel>
                  <FormControl>
                    <Input placeholder="Time do Jogador" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="email"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>E-mail</FormLabel>
                  <FormControl>
                    <Input placeholder="jogador@email.com" {...field} disabled={isEditing} />
                  </FormControl>
                   <FormDescription>
                    O e-mail não pode ser alterado após a criação.
                  </FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />
             <FormField
              control={form.control}
              name="initialScore"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Pontuação</FormLabel>
                  <FormControl>
                    <Input type="number" min="0" {...field} />
                  </FormControl>
                   <FormDescription>
                    Esta é a pontuação total do jogador.
                  </FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />
            {!isEditing && (
              <FormField
                control={form.control}
                name="password"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Senha</FormLabel>
                    <FormControl>
                      <Input
                        type="password"
                        placeholder="••••••••"
                        {...field}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            )}
            <FormField
              control={form.control}
              name="isAdmin"
              render={({ field }) => (
                <FormItem className="flex flex-row items-center justify-between rounded-lg border p-3 shadow-sm">
                  <div className="space-y-0.5">
                    <FormLabel>Administrador</FormLabel>
                    <FormDescription>
                      Tornar este usuário um administrador?
                    </FormDescription>
                  </div>
                  <FormControl>
                    <Switch
                      checked={field.value}
                      onCheckedChange={field.onChange}
                    />
                  </FormControl>
                </FormItem>
              )}
            />
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

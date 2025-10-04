import Link from "next/link";
import { RegisterForm } from "@/components/auth/register-form";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { FirebaseClientProvider } from "@/firebase";

export default function RegisterPage() {
  return (
    <FirebaseClientProvider>
      <Card className="w-full max-w-md">
        <CardHeader>
          <CardTitle className="font-headline text-2xl">Cadastro de Jogador</CardTitle>
          <CardDescription>
            Crie sua conta para começar a palpitar.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <RegisterForm />
        </CardContent>
        <CardFooter>
          <div className="text-sm text-muted-foreground">
            Já possui uma conta?{" "}
            <Link
              href="/login"
              className="font-medium text-primary underline-offset-4 hover:underline"
            >
              Faça login
            </Link>
          </div>
        </CardFooter>
      </Card>
    </FirebaseClientProvider>
  );
}

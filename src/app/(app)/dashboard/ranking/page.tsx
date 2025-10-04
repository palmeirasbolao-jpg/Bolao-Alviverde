import { RankingTabs } from "@/components/dashboard/ranking-tabs";

export default function RankingPage() {
  return (
    <div className="container mx-auto">
      <div className="mb-8">
        <h1 className="font-headline text-3xl font-bold">Ranking de Jogadores</h1>
        <p className="text-muted-foreground">
          Veja sua posição e a dos seus adversários no bolão.
        </p>
      </div>

      <RankingTabs />
    </div>
  );
}

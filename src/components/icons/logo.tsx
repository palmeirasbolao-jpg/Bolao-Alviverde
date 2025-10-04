import { Goal } from 'lucide-react';

export function Logo() {
  return (
    <div className="flex items-center gap-2">
      <Goal className="h-8 w-8 text-primary" />
      <span className="font-headline text-xl font-semibold">Bolão Alviverde</span>
    </div>
  );
}

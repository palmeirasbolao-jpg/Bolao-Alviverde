export type Player = {
  id: number;
  name: string;
  email: string;
  teamName: string;
  score: number;
  role: 'admin' | 'player';
  avatar: string;
};

export type Match = {
  id: number;
  date: string;
  round: number;
  month: string;
  homeTeam: string;
  awayTeam: string;
  homeScore?: number;
  awayScore?: number;
  status: 'scheduled' | 'finished';
};

export type Prediction = {
  id: number;
  playerId: number;
  matchId: number;
  homeScore: number;
  awayScore: number;
};

export const players: Player[] = [
  { id: 1, name: 'Admin', email: 'admin@example.com', teamName: 'Diretoria', score: 0, role: 'admin', avatar: '/avatars/01.png' },
  { id: 2, name: 'Ana Silva', email: 'ana@example.com', teamName: 'Verdão do Coração', score: 125, role: 'player', avatar: '/avatars/02.png' },
  { id: 3, name: 'Bruno Costa', email: 'bruno@example.com', teamName: 'Academia de Gênios', score: 110, role: 'player', avatar: '/avatars/03.png' },
  { id: 4, name: 'Carlos Pereira', email: 'carlos@example.com', teamName: 'Porco Invictus', score: 108, role: 'player', avatar: '/avatars/04.png' },
  { id: 5, name: 'Daniela Santos', email: 'daniela@example.com', teamName: 'Palestrinas FC', score: 95, role: 'player', avatar: '/avatars/05.png' },
];

export const matches: Match[] = [
  { id: 1, date: '2024-08-01T20:00:00', round: 1, month: 'Agosto', homeTeam: 'Palmeiras', awayTeam: 'Flamengo', homeScore: 2, awayScore: 1, status: 'finished' },
  { id: 2, date: '2024-08-08T20:00:00', round: 2, month: 'Agosto', homeTeam: 'Corinthians', awayTeam: 'Palmeiras', homeScore: 0, awayScore: 2, status: 'finished' },
  { id: 3, date: '2024-08-15T16:00:00', round: 3, month: 'Agosto', homeTeam: 'Palmeiras', awayTeam: 'São Paulo', status: 'scheduled' },
  { id: 4, date: '2024-08-22T21:30:00', round: 4, month: 'Agosto', homeTeam: 'Grêmio', awayTeam: 'Palmeiras', status: 'scheduled' },
  { id: 5, date: '2024-09-01T20:00:00', round: 5, month: 'Setembro', homeTeam: 'Palmeiras', awayTeam: 'Internacional', status: 'scheduled' },
  { id: 6, date: '2024-09-08T20:00:00', round: 6, month: 'Setembro', homeTeam: 'Santos', awayTeam: 'Palmeiras', status: 'scheduled' },
];

export const predictions: Prediction[] = [
  // Predictions for Match 1
  { id: 1, playerId: 2, matchId: 1, homeScore: 2, awayScore: 1 }, // Ana - acertou em cheio
  { id: 2, playerId: 3, matchId: 1, homeScore: 1, awayScore: 0 }, // Bruno - acertou vencedor
  { id: 3, playerId: 4, matchId: 1, homeScore: 2, awayScore: 0 }, // Carlos - acertou gols do vencedor
  { id: 4, playerId: 5, matchId: 1, homeScore: 1, awayScore: 1 }, // Daniela - errou
  
  // Predictions for Match 2
  { id: 5, playerId: 2, matchId: 2, homeScore: 1, awayScore: 2 }, // Ana - acertou gols do vencedor
  { id: 6, playerId: 3, matchId: 2, homeScore: 0, awayScore: 1 }, // Bruno - acertou gols do perdedor e vencedor
  { id: 7, playerId: 4, matchId: 2, homeScore: 0, awayScore: 2 }, // Carlos - acertou em cheio
  { id: 8, playerId: 5, matchId: 2, homeScore: 1, awayScore: 1 }, // Daniela - errou
];

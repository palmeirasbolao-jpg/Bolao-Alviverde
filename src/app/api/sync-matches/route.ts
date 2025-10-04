
// IMPORTANT: To use this API route, you must create a .env.local file
// in the root of your project and add your RapidAPI credentials:
// RAPIDAPI_KEY=your_secret_key
// RAPIDAPI_HOST=api-football-v1.p.rapidapi.com

import { NextResponse } from 'next/server';
import { initializeApp, getApps, App, deleteApp } from 'firebase-admin/app';
import { getFirestore, Firestore } from 'firebase-admin/firestore';
import { ServiceAccount, cert } from 'firebase-admin/credential';

// --- Helper Functions ---

// Initialize Firebase Admin SDK
function initializeFirebaseAdmin(): { db: Firestore; app: App } {
  const appName = 'firebase-admin-app-sync-matches';
  // Check if the app with this name is already initialized
  const existingApp = getApps().find(app => app.name === appName);
  if (existingApp) {
    return { db: getFirestore(existingApp), app: existingApp };
  }

  // This environment variable is automatically set by Firebase App Hosting.
  const serviceAccount = JSON.parse(
    process.env.FIREBASE_CONFIG || '{}'
  ) as ServiceAccount;

  const newApp = initializeApp({
    credential: cert(serviceAccount),
  }, appName);

  return { db: getFirestore(newApp), app: newApp };
}

// --- API Handler ---

export async function POST() {
  const { RAPIDAPI_KEY, RAPIDAPI_HOST } = process.env;
  const PALMEIRAS_TEAM_ID = 127; 
  const BRASILEIRAO_LEAGUE_ID = 71;
  const SEASON = new Date().getFullYear();
  let adminApp: App | undefined;

  if (!RAPIDAPI_KEY || !RAPIDAPI_HOST) {
    return NextResponse.json(
      { error: 'As variáveis de ambiente RAPIDAPI_KEY e RAPIDAPI_HOST são obrigatórias.' },
      { status: 500 }
    );
  }

  const url = `https://${RAPIDAPI_HOST}/v3/fixtures?league=${BRASILEIRAO_LEAGUE_ID}&season=${SEASON}&team=${PALMEIRAS_TEAM_ID}`;
  const options = {
    method: 'GET',
    headers: {
      'X-RapidAPI-Key': RAPIDAPI_KEY,
      'X-RapidAPI-Host': RAPIDAPI_HOST,
    },
  };

  try {
    // 1. Fetch matches from the external API
    const response = await fetch(url, options);
    const data = await response.json();

    if (!response.ok || data.errors?.length) {
      console.error('RapidAPI Error:', data.errors);
      throw new Error('Falha ao buscar dados da API de futebol.');
    }

    // 2. Initialize Firebase Admin
    const { db, app } = initializeFirebaseAdmin();
    adminApp = app;

    // 3. Process and save matches
    const matchesCol = db.collection('matches');
    let matchesAdded = 0;

    for (const item of data.response) {
      const match = {
        id: item.fixture.id.toString(),
        matchDateTime: item.fixture.date,
        homeTeam: item.teams.home.name,
        awayTeam: item.teams.away.name,
        homeTeamScore: item.goals.home,
        awayTeamScore: item.goals.away,
      };

      // Only save the match data. Do not calculate scores.
      const matchDocRef = matchesCol.doc(match.id);
      await matchDocRef.set(match, { merge: true });
      matchesAdded++;
    }

    return NextResponse.json({
      message: 'Sincronização de partidas concluída com sucesso! A atualização de pontos foi desativada para estabilizar o sistema.',
      matchesAdded,
    });
  } catch (error: any) {
    console.error('Erro no processo de sincronização:', error);
    return NextResponse.json(
      { error: error.message || 'Ocorreu um erro interno no servidor.' },
      { status: 500 }
    );
  }
}

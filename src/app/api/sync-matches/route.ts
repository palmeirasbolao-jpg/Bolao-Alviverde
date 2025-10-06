// IMPORTANT: To use this API route, you must create a .env.local file
// in the root of your project and add your RapidAPI credentials:
// RAPIDAPI_KEY=your_secret_key
// RAPIDAPI_HOST=api-football-v1.p.rapidapi.com

import { NextResponse } from 'next/server';
// ----------------------------------------------------------------------
// CORREÇÃO: Importe 'cert' e 'ServiceAccount' do caminho 'firebase-admin/app'
import { initializeApp, getApps, App, cert, ServiceAccount } from 'firebase-admin/app';
import { getFirestore, Firestore } from 'firebase-admin/firestore';
// ----------------------------------------------------------------------

// --- Helper Functions ---

let adminApp: App | undefined;
let firestore: Firestore | undefined;

function initializeFirebaseAdmin() {
  if (!adminApp) {
    const serviceAccount = JSON.parse(
      process.env.FIREBASE_CONFIG || '{}'
    ) as ServiceAccount;
    
    // Check if the app is already initialized to avoid errors
    if (getApps().length === 0) {
      adminApp = initializeApp({
        credential: cert(serviceAccount),
      });
    } else {
      adminApp = getApps()[0];
    }
  }
  if (!firestore) {
    firestore = getFirestore(adminApp);
  }
  return { db: firestore, app: adminApp };
}


// --- API Handler ---

export async function POST() {
  const { RAPIDAPI_KEY, RAPIDAPI_HOST } = process.env;
  const PALMEIRAS_TEAM_ID = 127; 
  const BRASILEIRAO_LEAGUE_ID = 71;
  const SEASON = new Date().getFullYear();

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
    const { db } = initializeFirebaseAdmin();

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

      // Only save the match data. The Cloud Function will handle score calculations.
      const matchDocRef = matchesCol.doc(match.id);
      await matchDocRef.set(match, { merge: true });
      matchesAdded++;
    }

    return NextResponse.json({
      message: 'Sincronização de partidas concluída. O cálculo de pontos será feito em segundo plano pela Cloud Function.',
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

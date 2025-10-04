// IMPORTANT: To use this API route, you must create a .env.local file
// in the root of your project and add your RapidAPI credentials:
// RAPIDAPI_KEY=your_secret_key
// RAPIDAPI_HOST=api-football-v1.p.rapidapi.com

import { NextResponse } from 'next/server';
import { initializeApp, getApps, App } from 'firebase-admin/app';
import { getFirestore, Firestore } from 'firebase-admin/firestore';
import { ServiceAccount, cert } from 'firebase-admin/credential';

// --- Helper Functions ---

// Initialize Firebase Admin SDK
function initializeFirebaseAdmin(): { db: Firestore } {
  // Check if the app is already initialized
  if (getApps().length) {
    return { db: getFirestore() };
  }

  // This environment variable is automatically set by Firebase App Hosting.
  const serviceAccount = JSON.parse(
    process.env.FIREBASE_CONFIG || '{}'
  ) as ServiceAccount;

  initializeApp({
    credential: cert(serviceAccount),
  });

  return { db: getFirestore() };
}

// Function to calculate points based on guess and result
const calculatePoints = (
  homeResult: number,
  awayResult: number,
  homeGuess: number,
  awayGuess: number
): number => {
    if (homeResult === homeGuess && awayResult === awayGuess) return 12; // Exact score
    
    const resultPalmeirasWon = homeResult > awayResult;
    const resultOtherTeamWon = homeResult < awayResult;
    const resultDraw = homeResult === awayResult;

    const guessPalmeirasWon = homeGuess > awayGuess;
    const guessOtherTeamWon = homeGuess < awayGuess;
    const guessDraw = homeGuess === awayGuess;

    if ((resultPalmeirasWon && guessPalmeirasWon) || (resultOtherTeamWon && guessOtherTeamWon) || (resultDraw && guessDraw)) {
        if (homeResult === homeGuess || awayResult === awayGuess) return 5; // Correct winner and one team's score
        return 3; // Correct winner only
    }

    if(homeResult === homeGuess || awayResult === awayGuess) return 1; // One team's score correct

    return 0;
};


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

      const matchDocRef = matchesCol.doc(match.id);
      await matchDocRef.set(match, { merge: true });
      matchesAdded++;

      // 4. If the match is finished, calculate points for all users
      const isFinished = item.fixture.status.short === 'FT';
      if (isFinished) {
        const usersSnapshot = await db.collection('users').get();
        const batch = db.batch();

        for (const userDoc of usersSnapshot.docs) {
          const guessDocRef = db.collection('users').doc(userDoc.id).collection('guesses').doc(match.id);
          const guessDoc = await guessDocRef.get();

          if (guessDoc.exists) {
            const guessData = guessDoc.data();
            if (guessData) {
                const points = calculatePoints(
                    match.homeTeamScore ?? 0,
                    match.awayTeamScore ?? 0,
                    guessData.homeTeamGuess,
                    guessData.awayTeamGuess
                );
                batch.update(guessDocRef, { pointsAwarded: points });
            }
          }
        }
        await batch.commit();

        // After updating points for all guesses in a match, update total scores
        const usersBatch = db.batch();
        for (const userDoc of usersSnapshot.docs) {
            const userRef = db.collection('users').doc(userDoc.id);
            const guessesSnapshot = await userRef.collection('guesses').get();
            
            let totalPoints = 0;
            guessesSnapshot.forEach(doc => {
                totalPoints += doc.data().pointsAwarded || 0;
            });
            usersBatch.update(userRef, { initialScore: totalPoints });
        }
        await usersBatch.commit();
      }
    }

    return NextResponse.json({
      message: 'Sincronização concluída com sucesso!',
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

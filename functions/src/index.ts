import { onDocumentUpdated } from "firebase-functions/v2/firestore";
import * as logger from "firebase-functions/logger";
import { initializeApp } from "firebase-admin/app";
import { getFirestore, Timestamp } from "firebase-admin/firestore";

initializeApp();
const db = getFirestore();

const calculatePoints = (
  guess: { homeTeamGuess: number; awayTeamGuess: number },
  result: { homeTeamScore: number; awayTeamScore: number }
): number => {
  if (
    guess.homeTeamGuess === result.homeTeamScore &&
    guess.awayTeamGuess === result.awayTeamScore
  ) {
    return 25;
  }

  const guessWinner =
    guess.homeTeamGuess > guess.awayTeamGuess
      ? "home"
      : guess.homeTeamGuess < guess.awayTeamGuess
      ? "away"
      : "draw";
  const actualWinner =
    result.homeTeamScore > result.awayTeamScore
      ? "home"
      : result.homeTeamScore < result.awayTeamScore
      ? "away"
      : "draw";

  if (
    guessWinner === actualWinner &&
    guess.homeTeamGuess - guess.awayTeamGuess ===
      result.homeTeamScore - result.awayTeamScore
  ) {
    return 18;
  }

  if (
    guessWinner === actualWinner &&
    (guess.homeTeamGuess === result.homeTeamScore ||
      guess.awayTeamGuess === result.awayTeamScore)
  ) {
    return 15;
  }

  if (guessWinner === actualWinner) {
    return 12;
  }

  if (guessWinner === "draw" && actualWinner === "draw") {
    return 12;
  }

  if (
    guess.homeTeamGuess === result.homeTeamScore ||
    guess.awayTeamGuess === result.awayTeamScore
  ) {
    return 5;
  }

  return 0;
};

export const calculateScoresOnMatchUpdate = onDocumentUpdated(
  {
    document: "matches/{matchId}",
    region: "us-central1"
  },
  async (event) => {
    logger.info(`Match updated: ${event.params.matchId}`);

    const before = event.data?.before.data();
    const after = event.data?.after.data();

    const scoreWasAdded =
      (before?.homeTeamScore == null) &&
      (after?.homeTeamScore != null);

    if (!scoreWasAdded) {
      logger.info("No score change detected, aborting score calculation.");
      return null;
    }

    const matchId = event.params.matchId;
    const matchResult = {
      homeTeamScore: after.homeTeamScore,
      awayTeamScore: after.awayTeamScore
    };
    const matchDateTime = after.matchDateTime;

    try {
      const guessesSnapshot = await db
        .collectionGroup("guesses")
        .where("matchId", "==", matchId)
        .get();

      if (guessesSnapshot.empty) {
        logger.info(`No guesses found for match ${matchId}.`);
        return null;
      }

      logger.info(`Found ${guessesSnapshot.size} guesses for match ${matchId}.`);

      const batch = db.batch();

      for (const guessDoc of guessesSnapshot.docs) {
        const guessData = guessDoc.data();
        const userId = guessData.userId;

        const pointsAwarded = calculatePoints(
          {
            homeTeamGuess: guessData.homeTeamGuess,
            awayTeamGuess: guessData.awayTeamGuess
          },
          matchResult
        );

        batch.update(guessDoc.ref, { pointsAwarded });

        const rankingDocRef = db.collection("ranking").doc(userId);
        const matchDate =
          matchDateTime instanceof Timestamp
            ? matchDateTime.toDate()
            : new Date(matchDateTime);
        const currentMonth = `${matchDate.getFullYear()}-${matchDate.getMonth() + 1}`;
        const currentRound = `round-${matchId}`;

        const rankingDoc = await rankingDocRef.get();
        if (rankingDoc.exists) {
          const rankingData = rankingDoc.data()!;
          const newTotalScore = (rankingData.totalScore || 0) + pointsAwarded;
          const newMonthlyScore = (rankingData.monthlyScore || 0) + pointsAwarded;
          const newRoundScore = (rankingData.roundScore || 0) + pointsAwarded;

          batch.update(rankingDocRef, {
            totalScore: newTotalScore,
            monthlyScore: newMonthlyScore,
            roundScore: newRoundScore,
            lastUpdatedMonth: currentMonth,
            lastUpdatedRound: currentRound
          });
        }
      }

      await batch.commit();
      logger.info(`Successfully calculated and committed scores for ${guessesSnapshot.size} users.`);
      return "Score calculation complete.";
    } catch (error) {
      logger.error("Error calculating scores:", error);
      return "Error during score calculation.";
    }
  }
);

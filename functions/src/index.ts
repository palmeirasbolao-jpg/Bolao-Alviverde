/**
 * Import function triggers from their respective submodules:
 *
 * import {onCall} from "firebase-functions/v2/https";
 * import {onDocumentWritten} from "firebase-functions/v2/firestore";
 *
 * See a full list of supported triggers at https://firebase.google.com/docs/functions
 */

import { onDocumentUpdated } from "firebase-functions/v2/firestore";
import * as logger from "firebase-functions/logger";
import { initializeApp } from "firebase-admin/app";
import { getFirestore } from "firebase-admin/firestore";
import { Timestamp } from "firebase-admin/firestore";

initializeApp();
const db = getFirestore();

// Define a function that calculates points based on the guess and the actual result.
const calculatePoints = (
  guess: { homeTeamGuess: number; awayTeamGuess: number },
  result: { homeTeamScore: number; awayTeamScore: number }
): number => {
  // Exact score guess
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

  // Guessed the winner and the goal difference
  if (
    guessWinner === actualWinner &&
    guess.homeTeamGuess - guess.awayTeamGuess ===
      result.homeTeamScore - result.awayTeamScore
  ) {
    return 18;
  }

  // Guessed the winner and one of the scores
  if (
    guessWinner === actualWinner &&
    (guess.homeTeamGuess === result.homeTeamScore ||
      guess.awayTeamGuess === result.awayTeamScore)
  ) {
    return 15;
  }

  // Guessed the winner
  if (guessWinner === actualWinner) {
    return 12;
  }

  // Guessed a draw, but not the exact score
  if (guessWinner === "draw" && actualWinner === "draw") {
    return 12;
  }

  // Guessed one of the scores correctly
  if (
    guess.homeTeamGuess === result.homeTeamScore ||
    guess.awayTeamGuess === result.awayTeamScore
  ) {
    return 5;
  }

  return 0; // No points
};

export const calculateScoresOnMatchUpdate = onDocumentUpdated(
  "matches/{matchId}",
  async (event) => {
    logger.info(`Match updated: ${event.params.matchId}`);

    const before = event.data?.before.data();
    const after = event.data?.after.data();

    // Check if the score was just added
    const scoreWasAdded =
      (before?.homeTeamScore === null || before?.homeTeamScore === undefined) &&
      (after?.homeTeamScore !== null && after?.homeTeamScore !== undefined);

    if (!scoreWasAdded) {
      logger.info("No score change detected, aborting score calculation.");
      return null;
    }

    const matchId = event.params.matchId;
    const matchResult = {
      homeTeamScore: after.homeTeamScore,
      awayTeamScore: after.awayTeamScore,
    };
    const matchDateTime = after.matchDateTime;

    try {
      // Find all users who made a guess for this match.
      const guessesSnapshot = await db
        .collectionGroup("guesses")
        .where("matchId", "==", matchId)
        .get();

      if (guessesSnapshot.empty) {
        logger.info(`No guesses found for match ${matchId}.`);
        return null;
      }

      logger.info(`Found ${guessesSnapshot.size} guesses for match ${matchId}.`);

      // Use a batch to update all documents atomically.
      const batch = db.batch();

      for (const guessDoc of guessesSnapshot.docs) {
        const guessData = guessDoc.data();
        const userId = guessData.userId;

        // 1. Calculate points for this guess
        const pointsAwarded = calculatePoints(
          {
            homeTeamGuess: guessData.homeTeamGuess,
            awayTeamGuess: guessData.awayTeamGuess,
          },
          matchResult
        );

        // 2. Update the guess document with the points.
        batch.update(guessDoc.ref, { pointsAwarded });

        // 3. Update the user's scores in the 'ranking' collection.
        const rankingDocRef = db.collection("ranking").doc(userId);
        const matchDate =
          matchDateTime instanceof Timestamp
            ? matchDateTime.toDate()
            : new Date(matchDateTime);
        const currentMonth = `${matchDate.getFullYear()}-${
          matchDate.getMonth() + 1
        }`;
        const currentRound = `round-${matchId}`; // Simple round identifier

        // Note: Using Firestore increments is safer for concurrent updates.
        // We will need to fetch the user doc to update monthly/round scores,
        // which adds complexity. For now, a direct update is simpler.
        // A more advanced implementation might use a separate transaction per user.

        const rankingDoc = await rankingDocRef.get();
        if (rankingDoc.exists) {
          const rankingData = rankingDoc.data()!;
          const newTotalScore = (rankingData.totalScore || 0) + pointsAwarded;
          // In a real app, you'd have a more complex logic to check if the
          // month/round is the current one. Here we just add.
          const newMonthlyScore =
            (rankingData.monthlyScore || 0) + pointsAwarded;
          const newRoundScore =
            (rankingData.roundScore || 0) + pointsAwarded;

          batch.update(rankingDocRef, {
            totalScore: newTotalScore,
            monthlyScore: newMonthlyScore,
            roundScore: newRoundScore,
            // You could store last updated month/round here
            lastUpdatedMonth: currentMonth,
            lastUpdatedRound: currentRound,
          });
        }
      }

      // Commit all the updates.
      await batch.commit();
      logger.info(
        `Successfully calculated and committed scores for ${guessesSnapshot.size} users.`
      );
      return "Score calculation complete.";
    } catch (error) {
      logger.error("Error calculating scores:", error);
      return "Error during score calculation.";
    }
  }
);

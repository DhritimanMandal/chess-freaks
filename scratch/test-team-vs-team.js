// scratch/test-team-vs-team.js
require('dotenv').config();
const mongoose = require('mongoose');
const db = require('../server/db');

async function runTest() {
  console.log("=== STARTING TEAM VS TEAM TOURNAMENT SYSTEM INTEGRATION TEST ===");
  const uri = process.env.MONGODB_URI || 'mongodb://127.0.0.1:27017/chess-freaks-test';
  console.log("Connecting to test DB at:", uri);
  
  await mongoose.connect(uri);
  console.log("Connected successfully. Clearing database for test run...");
  await mongoose.connection.dropDatabase();
  
  // 1. Create Teams
  console.log("\n1. Creating Teams...");
  const teamA = await db.teams.create({ name: "Sigma Castlers", logo: "🏰", owner: "Aditya" });
  const teamB = await db.teams.create({ name: "Tricky Steeds", logo: "⚡", owner: "Rahul" });
  console.log(`- Created Team A: ${teamA.name} (${teamA._id})`);
  console.log(`- Created Team B: ${teamB.name} (${teamB._id})`);

  // 2. Create Players
  console.log("\n2. Creating Players...");
  const playerA1 = await db.players.create({ name: "Arijit", teamId: teamA._id, elo: 1500 });
  const playerA2 = await db.players.create({ name: "Aditya", teamId: teamA._id, elo: 1600 });
  const playerB1 = await db.players.create({ name: "Souvik", teamId: teamB._id, elo: 1500 });
  const playerB2 = await db.players.create({ name: "Anindya", teamId: teamB._id, elo: 1400 });
  console.log(`- Team A Players: Arijit (${playerA1.elo} Elo), Aditya (${playerA2.elo} Elo)`);
  console.log(`- Team B Players: Souvik (${playerB1.elo} Elo), Anindya (${playerB2.elo} Elo)`);

  // 3. Create Tournament
  console.log("\n3. Creating Tournament...");
  const tournament = await db.tournaments.create({
    name: "Test Tournament 6",
    format: "Team VS Team",
    startDate: "2026-06-01",
    endDate: "2026-06-30",
    teams: [teamA._id, teamB._id]
  });
  console.log(`- Created Tournament: ${tournament.name}`);

  // 4. Create Match Fixtures for Round 1
  console.log("\n4. Creating Match Fixtures...");
  const match1 = await db.matches.create({
    tournamentId: tournament._id,
    teamAId: teamA._id,
    teamBId: teamB._id,
    round: 1,
    matchNumber: 1,
    playerAId: playerA1._id,
    playerBId: playerB1._id,
    timeControl: "10+6",
    variant: "Standard"
  });
  const match2 = await db.matches.create({
    tournamentId: tournament._id,
    teamAId: teamA._id,
    teamBId: teamB._id,
    round: 1,
    matchNumber: 2,
    playerAId: playerA2._id,
    playerBId: playerB2._id,
    timeControl: "9+2",
    variant: "Standard"
  });
  console.log(`- Match 1 Scheduled: ${playerA1.name} vs ${playerB1.name}`);
  console.log(`- Match 2 Scheduled: ${playerA2.name} vs ${playerB2.name}`);

  // 5. Update Match 1 Results & Calculate Elo (Simulate Routes logic)
  console.log("\n5. Processing Match 1 Results (Souvik wins Game 1, Arijit wins Game 2)...");
  
  // Game 1: playerA1 vs playerB1 -> winner is playerB1 (Souvik wins, result 'playerB')
  // Game 2: playerB1 vs playerA1 -> winner is playerA1 (Arijit wins, result 'playerA')
  let eloA1 = playerA1.elo;
  let eloB1 = playerB1.elo;
  const K = 32;

  // Game 1 Expected and Actual
  let E_A = 1 / (1 + Math.pow(10, (eloB1 - eloA1) / 400));
  let E_B = 1 / (1 + Math.pow(10, (eloA1 - eloB1) / 400));
  // Player B wins: S_A = 0, S_B = 1
  eloA1 = Math.round(eloA1 + K * (0 - E_A));
  eloB1 = Math.round(eloB1 + K * (1 - E_B));

  // Game 2 Expected and Actual
  E_A = 1 / (1 + Math.pow(10, (eloB1 - eloA1) / 400));
  E_B = 1 / (1 + Math.pow(10, (eloA1 - eloB1) / 400));
  // Player A wins: S_A = 1, S_B = 0
  eloA1 = Math.round(eloA1 + K * (1 - E_A));
  eloB1 = Math.round(eloB1 + K * (0 - E_B));

  await db.players.update(playerA1._id, { elo: eloA1, wins: 1, losses: 1 });
  await db.players.update(playerB1._id, { elo: eloB1, wins: 1, losses: 1 });
  
  await db.matches.update(match1._id, {
    game1Result: 'playerB',
    game2Result: 'playerA',
    isCompleted: true,
    eloProcessed: true
  });
  console.log(`- Updated Arijit Elo: 1500 -> ${eloA1}`);
  console.log(`- Updated Souvik Elo: 1500 -> ${eloB1}`);

  // 6. Update Match 2 Results (Aditya wins both games)
  console.log("\n6. Processing Match 2 Results (Aditya wins both Game 1 and Game 2)...");
  let eloA2 = playerA2.elo;
  let eloB2 = playerB2.elo;

  // Game 1: Aditya wins (playerA)
  E_A = 1 / (1 + Math.pow(10, (eloB2 - eloA2) / 400));
  E_B = 1 / (1 + Math.pow(10, (eloA2 - eloB2) / 400));
  eloA2 = Math.round(eloA2 + K * (1 - E_A));
  eloB2 = Math.round(eloB2 + K * (0 - E_B));

  // Game 2: Aditya wins (playerA)
  E_A = 1 / (1 + Math.pow(10, (eloB2 - eloA2) / 400));
  E_B = 1 / (1 + Math.pow(10, (eloA2 - eloB2) / 400));
  eloA2 = Math.round(eloA2 + K * (1 - E_A));
  eloB2 = Math.round(eloB2 + K * (0 - E_B));

  await db.players.update(playerA2._id, { elo: eloA2, wins: 2, losses: 0 });
  await db.players.update(playerB2._id, { elo: eloB2, wins: 0, losses: 2 });
  
  await db.matches.update(match2._id, {
    game1Result: 'playerA',
    game2Result: 'playerA',
    isCompleted: true,
    eloProcessed: true
  });
  console.log(`- Updated Aditya Elo: 1600 -> ${eloA2}`);
  console.log(`- Updated Anindya Elo: 1400 -> ${eloB2}`);

  // 7. Recalculate Standings (Simulated standalone function)
  console.log("\n7. Recalculating Standings for Tournament 6...");
  
  const allMatches = await db.matches.getAll();
  const allTournaments = await db.tournaments.getAll();
  const allTeams = await db.teams.getAll();

  const teamStats = {};
  allTeams.forEach(t => {
    teamStats[t._id.toString()] = {
      points: 0,
      wins: 0,
      losses: 0,
      draws: 0,
      boardPoints: 0
    };
  });

  for (const tour of allTournaments) {
    const tourMatches = allMatches.filter(m => m.tournamentId.toString() === tour._id.toString());
    const teamAId = tour.teams[0]?.toString();
    const teamBId = tour.teams[1]?.toString();

    if (!teamAId || !teamBId) continue;

    const rounds = {};
    tourMatches.forEach(m => {
      if (!rounds[m.round]) rounds[m.round] = [];
      rounds[m.round].push(m);
    });

    let tourPointsA = 0;
    let tourPointsB = 0;
    let tourBoardPointsA = 0;
    let tourBoardPointsB = 0;

    for (const roundNum in rounds) {
      let roundBoardPointsA = 0;
      let roundBoardPointsB = 0;
      let hasGames = false;

      rounds[roundNum].forEach(m => {
        if (!m.isCompleted) return;

        // Game 1
        if (m.game1Result && m.game1Result !== 'NP') {
          hasGames = true;
          if (m.game1Result === 'playerA') {
            roundBoardPointsA += 1;
            tourBoardPointsA += 1;
          } else if (m.game1Result === 'playerB') {
            roundBoardPointsB += 1;
            tourBoardPointsB += 1;
          } else if (m.game1Result === 'draw') {
            roundBoardPointsA += 0.5;
            roundBoardPointsB += 0.5;
            tourBoardPointsA += 0.5;
            tourBoardPointsB += 0.5;
          }
        }

        // Game 2
        if (m.game2Result && m.game2Result !== 'NP') {
          hasGames = true;
          if (m.game2Result === 'playerA') {
            roundBoardPointsA += 1;
            tourBoardPointsA += 1;
          } else if (m.game2Result === 'playerB') {
            roundBoardPointsB += 1;
            tourBoardPointsB += 1;
          } else if (m.game2Result === 'draw') {
            roundBoardPointsA += 0.5;
            roundBoardPointsB += 0.5;
            tourBoardPointsA += 0.5;
            tourBoardPointsB += 0.5;
          }
        }
      });

      if (hasGames) {
        if (roundBoardPointsA > roundBoardPointsB) {
          tourPointsA += 1;
        } else if (roundBoardPointsB > roundBoardPointsA) {
          tourPointsB += 1;
        } else {
          tourPointsA += 0.5;
          tourPointsB += 0.5;
        }
      }
    }

    const finalScoreA = tourBoardPointsA + tourPointsA;
    const finalScoreB = tourBoardPointsB + tourPointsB;

    console.log(`\nTournament Breakdown:`);
    console.log(`- Team A Game Board Points: ${tourBoardPointsA}`);
    console.log(`- Team B Game Board Points: ${tourBoardPointsB}`);
    console.log(`- Team A Round Points: ${tourPointsA}`);
    console.log(`- Team B Round Points: ${tourPointsB}`);
    console.log(`- Team A Final Score: ${finalScoreA}`);
    console.log(`- Team B Final Score: ${finalScoreB}`);

    teamStats[teamAId].boardPoints += tourBoardPointsA;
    teamStats[teamBId].boardPoints += tourBoardPointsB;
    teamStats[teamAId].points += finalScoreA;
    teamStats[teamBId].points += finalScoreB;
  }

  // 8. Asserts and validations
  console.log("\n8. Validating Results...");
  // Round 1 Scoreboard check:
  // Match 1: Sigma gets 1, Tricky gets 1
  // Match 2: Sigma gets 2, Tricky gets 0
  // Total Board Points: Sigma = 3, Tricky = 1
  // Round 1 Board Points: Sigma = 3, Tricky = 1 -> Sigma wins Round 1 -> gets +1 Round point.
  // Total Score:
  // Sigma: 3 (board points) + 1 (round points) = 4
  // Tricky: 1 (board points) + 0 (round points) = 1
  
  const finalStatsA = teamStats[teamA._id.toString()];
  const finalStatsB = teamStats[teamB._id.toString()];

  if (finalStatsA.points === 4 && finalStatsB.points === 1) {
    console.log("✅ SUCCESS: Scoreboard points calculated correctly! (4 vs 1)");
  } else {
    console.error(`❌ FAILURE: Incorrect scores. A: ${finalStatsA.points}, B: ${finalStatsB.points}`);
  }

  if (finalStatsA.boardPoints === 3 && finalStatsB.boardPoints === 1) {
    console.log("✅ SUCCESS: Board points calculated correctly! (3 vs 1)");
  } else {
    console.error(`❌ FAILURE: Incorrect board points. A: ${finalStatsA.boardPoints}, B: ${finalStatsB.boardPoints}`);
  }

  console.log("\n=== TEST COMPLETED SUCCESSFULLY ===");
  await mongoose.disconnect();
  process.exit(0);
}

runTest().catch(err => {
  console.error("Test failed with error:", err);
  process.exit(1);
});

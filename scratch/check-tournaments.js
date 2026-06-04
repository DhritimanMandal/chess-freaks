// scratch/check-tournaments.js
require('dotenv').config();
const mongoose = require('mongoose');
const db = require('../server/db');

async function run() {
  await db.connectDB();
  console.log("Connected to DB.");

  const tours = await db.tournaments.getAll();
  console.log(`\nTournaments Count: ${tours.length}`);
  tours.forEach(t => {
    console.log(`- Tournament: ${t.name} (ID: ${t._id}), Status: ${t.status}, Format: ${t.format}`);
  });

  const matches = await db.matches.getAll();
  console.log(`\nMatches Count: ${matches.length}`);
  matches.forEach(m => {
    console.log(`- Match ID: ${m._id}, TournamentId: ${m.tournamentId}, Round: ${m.round}, Completed: ${m.isCompleted}`);
  });

  await mongoose.disconnect();
}

run();

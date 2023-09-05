const express = require("express");
const sqlite3 = require("sqlite3");
const { open } = require("sqlite");

const app = express();
app.use(express.json());

const dbPath = "cricketMatchDetails.db"; // Change this to your database path

let db = null;

const initializeDBAndServer = async () => {
  try {
    db = await open({
      filename: dbPath,
      driver: sqlite3.Database,
    });
    app.listen(3000, () => {
      console.log("Server Running at http://localhost:3000/");
    });
  } catch (e) {
    console.error(`DB Error: ${e.message}`);
    process.exit(1);
  }
};

initializeDBAndServer();

// API 1: Get all players
app.get("/players/", async (request, response) => {
  const getPlayersQuery = `
    SELECT player_id AS playerId, player_name AS playerName
    FROM player_details;`;
  const playersArray = await db.all(getPlayersQuery);
  response.send(playersArray);
});

// API 2: Get a player by ID
app.get("/players/:playerId/", async (request, response) => {
  const playerId = request.params.playerId;

  const getPlayerQuery = `
    SELECT player_id AS playerId, player_name AS playerName
    FROM player_details
    WHERE player_id = ${playerId};`;

  try {
    const player = await db.get(getPlayerQuery);

    if (player) {
      response.send(player);
    } else {
      response.status(404).send("Player not found");
    }
  } catch (e) {
    console.error(`Error fetching player: ${e.message}`);
    response.status(500).send("Internal Server Error");
  }
});

// API 3: Update a player by ID
app.put("/players/:playerId/", async (request, response) => {
  const playerId = request.params.playerId;
  const { playerName } = request.body;

  const updatePlayerQuery = `
    UPDATE player_details
    SET player_name = '${playerName}'
    WHERE player_id = ${playerId};`;

  try {
    await db.run(updatePlayerQuery);
    response.send("Player Details Updated");
  } catch (e) {
    console.error(`Error updating player: ${e.message}`);
    response.status(500).send("Internal Server Error");
  }
});

// API 4: Get a match by ID
app.get("/matches/:matchId/", async (request, response) => {
  const matchId = request.params.matchId;

  const getMatchQuery = `
    SELECT match_id AS matchId, match, year
    FROM match_details
    WHERE match_id = ${matchId};`;

  try {
    const match = await db.get(getMatchQuery);

    if (match) {
      response.send(match);
    } else {
      response.status(404).send("Match not found");
    }
  } catch (e) {
    console.error(`Error fetching match: ${e.message}`);
    response.status(500).send("Internal Server Error");
  }
});

// API 5: Get matches for a player by ID
app.get("/players/:playerId/matches/", async (request, response) => {
  const playerId = request.params.playerId;

  const getPlayerMatchesQuery = `
    SELECT match_details.match_id AS matchId, match, year
    FROM match_details
    INNER JOIN player_match_score ON match_details.match_id = player_match_score.match_id
    WHERE player_match_score.player_id = ${playerId};`;

  try {
    const playerMatches = await db.all(getPlayerMatchesQuery);
    response.send(playerMatches);
  } catch (e) {
    console.error(`Error fetching player's matches: ${e.message}`);
    response.status(500).send("Internal Server Error");
  }
});

// API 6: Get players for a match by ID
app.get("/matches/:matchId/players/", async (request, response) => {
  const matchId = request.params.matchId;

  const getMatchPlayersQuery = `
    SELECT player_details.player_id AS playerId, player_name AS playerName
    FROM player_details
    INNER JOIN player_match_score ON player_details.player_id = player_match_score.player_id
    WHERE player_match_score.match_id = ${matchId};`;

  try {
    const matchPlayers = await db.all(getMatchPlayersQuery);
    response.send(matchPlayers);
  } catch (e) {
    console.error(`Error fetching match players: ${e.message}`);
    response.status(500).send("Internal Server Error");
  }
});

// API 7: Get player statistics by ID
app.get("/players/:playerId/playerScores/", async (request, response) => {
  const playerId = request.params.playerId;

  const getPlayerStatsQuery = `
    SELECT player_details.player_id AS playerId, player_name AS playerName,
           SUM(score) AS totalScore, SUM(fours) AS totalFours, SUM(sixes) AS totalSixes
    FROM player_details
    INNER JOIN player_match_score ON player_details.player_id = player_match_score.player_id
    WHERE player_details.player_id = ${playerId};`;

  try {
    const playerStats = await db.get(getPlayerStatsQuery);
    if (playerStats) {
      response.send(playerStats);
    } else {
      response.status(404).send("Player not found");
    }
  } catch (e) {
    console.error(`Error fetching player stats: ${e.message}`);
    response.status(500).send("Internal Server Error");
  }
});

module.exports = app;

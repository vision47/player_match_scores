const express = require("express");
const { open } = require("sqlite");
const sqlite3 = require("sqlite3");
const path = require("path");

const app = express();

app.use(express.json());

let cricketDb = null;

const initializeDbAndServer = async () => {
  try {
    // Db initialize
    cricketDb = await open({
      filename: path.join(__dirname, "./cricketMatchDetails.db"),
      driver: sqlite3.Database,
    });
    // Server initialize
    app.listen(3000, () => {
      console.log("server running at http://localhost:3000/");
    });
  } catch (err) {
    console.log(err.message);
    process.exit(1);
  }
};

initializeDbAndServer();

const convertPlayerObjectToResponseObject = (playerObject) => {
  return {
    playerId: playerObject.player_id,
    playerName: playerObject.player_name,
  };
};

// Get Players
app.get("/players/", async (request, response) => {
  try {
    const getPlayersQuery = `
    SELECT * FROM player_details;`;
    const playersArray = await cricketDb.all(getPlayersQuery);
    response.send(
      playersArray.map((eachPlayer) =>
        convertPlayerObjectToResponseObject(eachPlayer)
      )
    );
  } catch (err) {
    console.log(err.message);
    process.exit(1);
  }
});

// get player
app.get("/players/:playerId/", async (request, response) => {
  try {
    const { playerId } = request.params;
    const getPlayerQuery = `
    SELECT * 
    FROM 
    player_details 
    WHERE
    player_id = '${playerId}';`;
    const playerDetails = await cricketDb.get(getPlayerQuery);
    response.send(convertPlayerObjectToResponseObject(playerDetails));
  } catch (err) {
    console.log(err.message);
    process.exit(1);
  }
});

// update player Name
app.put("/players/:playerId/", async (request, response) => {
  try {
    const { playerId } = request.params;
    const playerDetails = request.body;
    const { playerName } = playerDetails;
    const updatePlayerQuery = `
    UPDATE
    player_details
    SET
    player_name = '${playerName}'
    WHERE
    player_id = '${playerId}';`;
    const DbResponse = await cricketDb.run(updatePlayerQuery);
    response.send("Player Details Updated");
  } catch (err) {
    console.log(err.message);
    process.exit(1);
  }
});

const convertMatchObjectToResponseObject = (matchObject) => {
  return {
    matchId: matchObject.match_id,
    match: matchObject.match,
    year: matchObject.year,
  };
};

// get match details
app.get("/matches/:matchId/", async (request, response) => {
  try {
    const { matchId } = request.params;
    const getMatchQuery = `
    SELECT *
    FROM
    match_details
    WHERE
    match_id = '${matchId}';`;
    const matchDetails = await cricketDb.get(getMatchQuery);
    response.send(convertMatchObjectToResponseObject(matchDetails));
  } catch (err) {
    console.log(err.message);
    process.exit(1);
  }
});

// const convertPlayerMatchObjectToResponseObject = (playerMatchObject) => {
//   return {
//     matchId: playerMatchObject.match_id,
//     match: playerMatchObject.match,
//     year: playerMatchObject.year,
//   };
// };

// get player's match details
app.get("/players/:playerId/matches", async (request, response) => {
  try {
    const { playerId } = request.params;
    const getPlayerMatchQuery = `
    SELECT *
    FROM
    player_match_score NATURAL JOIN match_details
    WHERE
    player_id = '${playerId}';`;
    const matchDetails = await cricketDb.all(getPlayerMatchQuery);
    response.send(matchDetails.map(convertMatchObjectToResponseObject));
  } catch (err) {
    console.log(err.message);
    process.exit(1);
  }
});

// get match's players details
app.get("/matches/:matchId/players/", async (request, response) => {
  try {
    const { matchId } = request.params;
    const getMatchPlayersQuery = `
    SELECT *
    FROM
    player_match_score Natural JOIN player_details
    WHERE
    match_id = '${matchId}';`;
    const playersDetails = await cricketDb.all(getMatchPlayersQuery);
    response.send(playersDetails.map(convertPlayerObjectToResponseObject));
  } catch (err) {
    console.log(err.message);
    process.exit(1);
  }
});

// get player's statistics details
app.get("/players/:playerId/playerScores/", async (request, response) => {
  try {
    const { playerId } = request.params;
    const getPlayerScoreQuery = `
    SELECT player_id AS playerId,
    player_name AS playerName,
    SUM(score) AS totalScore,
    SUM(fours) AS totalFours,
    SUM(sixes) AS totalSixes
    FROM
    player_match_score NATURAL JOIN player_details
    WHERE
    playerId = '${playerId}';`;
    const playerStats = await cricketDb.get(getPlayerScoreQuery);
    response.send(playerStats);
  } catch (err) {
    console.log(err.message);
    process.exit(1);
  }
});

module.exports = app;

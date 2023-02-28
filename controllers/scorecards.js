const hri = require('human-readable-ids');
const scorecards = require('../scorecards');

let origin = process.env.PROD_CORS_ORIGIN;

if (process.env.NODE_ENV === 'development') {
  origin = process.env.DEV_CORS_ORIGIN;
}

/**
 * Get all scorecards
 * @route GET /v1/scorecards
 */
exports.getScorecards = async (req, res, next) => {
  res.header('Access-Control-Allow-Origin', origin);
  try {
    setTimeout(() => {
      res.json(scorecards);
    }, 3000);
  } catch (error) {
    return res.status(500).json({
      success: false,
      error: 'Server Error',
    });
  }
};

/**
 * Get scorecard by gameId
 * @route GET /v1/scorecards/:gameId
 */
exports.getScorecardByGameId = async (req, res, next) => {
  res.header('Access-Control-Allow-Origin', origin);
  try {
    const found = scorecards.some(
      (scorecard) => scorecard.gameId === req.params.gameId
    );
    if (found) {
      res.json(
        scorecards.filter(
          (scorecard) => scorecard.gameId === req.params.gameId
        )[0]
      );
    } else {
      res
        .status(400)
        .json({ msg: `No scorecard with gameId of ${req.params.gameId}` });
    }
  } catch (error) {
    return res.status(500).json({
      success: false,
      error: 'Server Error',
    });
  }
};

/**
 * add a scorecard
 * @route POST /v1/scorecards
 */
exports.addScorecard = async (req, res, next) => {
  res.header('Access-Control-Allow-Origin', origin);
  try {
    const newScorecard = {
      gameId: hri.humanReadableIds.random(),
      name: req.body.name,
      status: req.body.status,
      scorecard: req.body.scorecard,
      playerTotals: req.body.playerTotals,
      currentRound: req.body.currentRound,
    };

    //check for incomplete scorecard
    if (
      !newScorecard.name ||
      !newScorecard.scorecard ||
      !newScorecard.playerTotals
    ) {
      return res.status(400).json({
        msg: 'Incomplete scorecard received. Please send scorecard name, a scoreard, and playerTotals',
      });
    }

    // add to server's scorecard array
    scorecards.push(newScorecard);

    // console.log(newScorecard);

    // TODO: consider having the server save the current scorecards to a local file

    // respond with newly created object
    res.location('/api/sk-scorecard-api/v1/scorecards/' + newScorecard.gameId);
    res.status(201).json(newScorecard);
  } catch (error) {
    return res.status(500).json({
      success: false,
      error: `Server Error: ${error}`,
    });
  }
};

/**
 * update a scorecard
 * @route PUT /v1/scorecards/:gameId
 */
exports.updateScorecard = async (req, res, next) => {
  res.header('Access-Control-Allow-Origin', origin);
  try {
    const found = scorecards.some(
      (scorecard) => scorecard.gameId === req.params.gameId
    );

    if (found) {
      const newScorecard = req.body;

      scorecards.forEach((scorecard) => {
        if (scorecard.gameId === req.params.gameId) {
          // update values that were in the body otherwise use old value
          scorecard.status = newScorecard.status || scorecard.status;
          scorecard.scorecard = newScorecard.scorecard || scorecard.scorecard;
          scorecard.playerTotals =
            newScorecard.playerTotals || scorecard.playerTotals;
          scorecard.currentRound =
            newScorecard.currentRound || scorecard.currentRound;

          //send response with updated obj
          res.json(scorecard);
          // console.log(scorecard);

          // push update to all sockets in this game room
          req.io.to(scorecard.gameId).emit('update-game', scorecard);

          // TODO: Consider saving the updated scorecards array to a file
        }
      });
    } else {
      res
        .status(400)
        .json({ msg: `No scorecard with gameId of ${req.params.gameId}` });
    }
  } catch (error) {
    return res.status(500).json({
      success: false,
      error: 'Server Error',
    });
  }
};

/**
 *
 * delete a scorecard
 * @route DELETE /v1/scorecards/:gameId
 * @returns
 */
exports.deleteScorecard = async (req, res, next) => {
  res.header('Access-Control-Allow-Origin', origin);
  try {
    const indexToRemove = scorecards.findIndex(
      (scorecard) => scorecard.gameId === req.params.gameId
    );

    if (indexToRemove != -1) {
      scorecards.splice(indexToRemove, 1);

      // TODO: Consider saving the updated scorecards array to a file

      res.status(204).send();
    } else {
      res
        .status(400)
        .json({ msg: `No scorecard with gameId of ${req.params.gameId}` });
    }
  } catch (error) {
    return res.status(500).json({
      success: false,
      error: 'Server Error',
    });
  }
};

exports.optionsScorecard = async (req, res, next) => {
  try {
    res.header('Access-Control-Allow-Origin', origin);
    res.header('Access-Control-Allow-Headers', 'Content-Type');
    res.header('Access-Control-Allow-Methods', 'GET, PUT');
    res.status(200).send();
  } catch (error) {
    return res.status(500).json({
      success: false,
      error: 'Server Error',
    });
  }
};

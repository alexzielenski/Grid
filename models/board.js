Boards = new Meteor.Collection("boards", {
    // transform: function (doc) {
    //     doc.turn = calculateTurn(doc);
    //     return doc;
    // }
});
/*

    Each board is represented by a document in the boards collection:
    initiator: {
        id: string
        tiles: []
    }
    target: {
        id: string
        tiles: []
    }
    turn: "initiator" or "target"
    winner: "initiator" or "target"
    createdAt: date
    updatedAt: date
    finishedAt: date
    wide: number
    tall: number

 */


Boards.allow({
    insert: function (userId, board) {
        return false;
    },
    update: function (userId, board, fields, modifier) {
        return false;
    },
    remove: function (userId, board) {
        return false;
    }
});

calculateTurn = function (board) {
    return (Math.min(board.target.tiles.length, board.initiator.tiles.length) == board.target.tiles.length) ? "target" : "initiator";
}

checkVictory = function (board, col, row) {
    var player = ownerAtPoint(board, col, row);
    if (!player)
        return undefined;

    var i, j, x, y, maxX, maxY, steps, count = 0,
    directions = [
        { x: 0, y: 1  }, // North-South
        { x: 1, y: 0  }, // East-West
        { x: 1, y: 1  }, // Northeast-Southwest
        { x: 1, y: -1 }  // Southeast-Northwest
    ];

    // Check all directions
    outerloop:
    for (i = 0; i < directions.length; i++, count = 0) {
//        console.log("\nTest " + i + "\n");
        // reset count for each direction
        count = 0;

        // Set up bounds to go 3 pieces forward and backward
        x     = col - (3 * directions[i].x);
        y     = row - (3 * directions[i].y);
        maxX  = col + (3 * directions[i].x);
        maxY  = row + (3 * directions[i].y);
        steps = Math.max(Math.abs(maxX - x), Math.abs(maxY - y));

        for (j = 0; j <= steps; j++, x += directions[i].x, y += directions[i].y) {
            if (x < 0 || y < 0 || x > board.wide - 1 || y > board.tall - 1)
                continue;

            if (ownerAtPoint(board, x, y) == player) {
//                console.log("Match [" + x + ", " + y + "]");
                // Increase count
                if (++count >= 4)
                  break outerloop;
            } else {
//                console.log("Break [" + x + ", " + y + "]");
                // Reset count
                count = 0;
            }
        }
    }
    return count >= 4 ? player : undefined;
};

ownerAtIndex = function (board, idx) {
    if (!board.initiator || !board.initiator.tiles || !board.target || !board.target.tiles)
        return undefined;

    if (board.initiator.tiles.indexOf(idx) != -1)
        return "initiator";
    else if (board.target.tiles.indexOf(idx) != -1)
        return "target";

    return undefined;
};

ownerAtPoint = function (board, col, row) {
    if (col < 0 || row < 0 || col > board.wide - 1 || row > board.tall - 1)
        return undefined;
    var idx = row * board.wide + col;

    return ownerAtIndex(board, idx);
};

colorForPlayer = function(data, name) {
    if (!data || data.name)
        return "rgb(0,0,0)";
    var player = data[name];
    var involved = involvedInGame(data, Meteor.userId());

    if (player) {
        var user1 = Users.findOne(player.id, { fields: { "profile": 1 } });

        if (!user1) {
            return "rgb(0,0,0)"
        }

        if (user1 && user1.profile.adjustedColor && involved) {
            return user1.profile.adjustedColor;
        }

        // if spectating, vary the target color from the initiator
        if (!involved && name == "target") {
            var other  = data[otherPlayer(name)];
            var user2 = Users.findOne(other.id, { fields: { "profile": 1 } });
            return varyColorFromColor(user1.profile.color, user2.profile.color)[0].hslString();
        }

        return user1.profile.color;
    }

    return "rgb(0,0,0)";
};

keyForUser = function (board, user_id) {
    if (!board || !board.initiator || !board.target)
        return undefined;
    if (board.initiator.id == user_id)
        return "initiator";
    else if (board.target.id == user_id)
        return "target";
    return undefined;
};

involvedInGame = function (board, user_id) {
    return typeof keyForUser(board, user_id) == "string";
};

otherPlayer = function (key) {
    return key == "target" ? "initiator" : "target";
};

moveCount = function (board) {
    return board[otherPlayer(board.turn)].tiles.length;
}

commitToHistory = function(board_id, winner, loser, forfeit, draw, createdAt, moves) {
    var userUpdate = { $pull: { "history.active": { id: board_id } }, $addToSet: {}, $inc: {}};
    var entry = { id: board_id, opponent: loser, forfeit: forfeit, finishedAt: new Date(), createdAt: createdAt, turns: moves };

    if (!draw) {
        userUpdate.$addToSet["history.wins"] = entry;
        userUpdate.$inc["record.wins"] = 1;
        Users.update(winner, userUpdate);

        userUpdate.$addToSet = {};
        userUpdate.$inc["record.losses"] = 1;
        userUpdate.$inc["record.wins"] = 0;
        entry.opponent = winner;

        userUpdate.$addToSet["history.losses"] = entry;
        Users.update(loser, userUpdate);
    } else {
        userUpdate.$inc["record.draws"] = 1;
        userUpdate.$addToSet["history.draws"] = entry;
        Users.update(winner, userUpdate);

        userUpdate.$addToSet["history.draws"].opponent = winner;
        Users.update(loser, userUpdate);
    }
}

Meteor.methods({
    "move": function (board, col) {
        if (typeof board == "string")
            board = Boards.findOne(board);

        col = parseInt(col);

        if (col >= board.wide || col < 0) {
            throw new Meteor.Error(400, "Invalid column number");
        }

        if (board.finishedAt)
            throw new Meteor.Error(400, "You cannot modify an already completed game");

        var user = keyForUser(board, this.userId);
        if (board.turn != user) {
            throw new Meteor.Error(400, "It is not your turn!");
        }

        if (Math.abs(new Date() - board.updatedAt) <= 1000) {
            throw new Meteor.Error(400, "Your move has taken place too soon after a previous one. Try again.");
        }

        var firstZero = -1;
        for (var row = 0; row < board.tall; row++) {
            if (!ownerAtPoint(board, col, row)) {// empty
                firstZero = row * board.wide + col;
                break;
            }
        }

        // Check for space in column
        if (firstZero === -1) {
            throw new Meteor.Error(400, "No room in column to drop piece");
        } else if (!(typeof firstZero == 'number')) {
            throw new Meteor.Error(400, "Index is not a number");
        } else if (Meteor.isServer||true) {
            var update = {};
            update[user + ".tiles"] = firstZero;

            // simulate the board move to caluclate the turn
            board[user].tiles.push(firstZero);
            update = { $addToSet: update, $set: { turn: calculateTurn(board), updatedAt: new Date() } };

            var victory = checkVictory(board, firstZero % board.wide, parseInt(Math.floor(firstZero / board.wide)));
            if (victory) {
                update.$set.winner     = victory;
                update.$set.finishedAt = update.$set.updatedAt;
                update.$set.forfeit    = false;

                var winner = victory;
                var loser  = (winner == "target") ? "initiator" : "target";

                // Update the users
                var winner_id = board[winner].id;
                var loser_id  = board[loser].id;

                commitToHistory(board._id, winner_id, loser_id, false, false, board.createdAt, moveCount(board));
            }else if (board.wide * board.tall <= (board.target.tiles.length + board.initiator.tiles.length)) {
                // draw
                update.$set.draw       = true;
                update.$set.finishedAt = update.$set.updatedAt;
                update.$set.winner     = null;

                commitToHistory(board._id, board.initiator.id, board.target.id, false, true, board.createdAt, moveCount(board));
            }

            Boards.update(board._id, update);
        }


        return board._id;
    },
    "forfeit": function (board) {
        if (typeof board == "string")
            board = Boards.findOne(board);
        if (!board)
            throw new Meteor.Error(400, "Cannot forfeit nonexistant board");

        if (board.initiator.id != this.userId && board.target.id != this.userId)
            throw new Meteor.Error(400, "You cannot forfeit a game you are not part of!");

        var loser  = keyForUser(board, this.userId);
        var winner = (loser == "target") ? "initiator" : "target";

        commitToHistory(board._id, board[winner].id, board[loser].id, true, false, board.createdAt, moveCount(board));

        var update = { $set: { updatedAt: new Date(), finishedAt: new Date(), winner: winner, forfeit: true } };
        return Boards.update(board._id, update);
    },
    "togglePublicity": function (board) {
        if (typeof board == "string")
            board = Boards.findOne(board);
        else
            throw new Meteor.Error(400, "Passed invalid board ID");
        if (!board)
            throw new Meteor.Error(400, "Cannot find nonexistant board");
        if (board.initiator.id != this.userId && board.target.id != this.userId)
            throw new Meteor.Error(400, "You cannot modify a game you are not part of!");

        var update = { $set: { "public": !board.public } };
        return Boards.update(board._id, update);
    }
});

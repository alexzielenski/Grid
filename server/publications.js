Meteor.publish("user", function () {
    return Users.find({ _id: this.userId });
});

Meteor.publish("activeBoards", function (skip) {
    return Boards.find({ $or: [ { "target.id": this.userId, winner: { $exists: false } }, { "initiator.id": this.userId, winner: { $exists: false } } ] });
});

Meteor.publish("finishedBoards", function () {
    return Boards.find({ $or: [ { "target.id": this.userId, winner: { $exists: true } }, { "initiator.id": this.userId, winner: { $exists: true } } ] }, { sort: { finishedAt: -1 }, skip: 0, limit: 12 });
});

Meteor.publish("board", function (board_id) {
    // had to remove the public game requirement so we can spectate on refresh
    var boardCursor = Boards.find({ _id: board_id }, { limit: 1 });

    if (!boardCursor.count())
        return;

    var board = boardCursor.fetch()[0];
    var usersCursor = Users.find( { $or: [ { _id: board.initiator.id }, { _id: board.target.id } ] }, { fields: { "services": 0, "friends": 0, "requests": 0, "invites": 0, "emails": 0, "history": 0 } } );

    return [ boardCursor, usersCursor ];
});

Meteor.publish("userSearch", function (query) {
    var regex = { $regex: "^" + query };

    var rtn  = Users.find({
        friends: { "$not": { $in: [ this.userId ] } },
        $or: [
            { _id: query },
            { "profile.name": regex },
            { "emails.address": regex }
        ] },
        { fields: { "profile": 1, "createdAt": 1 } });

    return rtn;
});

Meteor.publish("opponents", function (userId) {
    check(userId, String);

    return Users.find({ $or: [
        { "requests.received.opponent": userId },
        { "requests.initiated.opponent": userId },
        { "invites.received.opponent": userId },
        { "invites.initiated.opponent": userId },
        { "history.active.opponent": userId },
        { "history.wins.opponent": userId },
        { "history.losses.opponent": userId },
        { "history.draws.opponent": userId } ] }, { fields: { "services": 0, "friends": 0, "requests": 0, "invites": 0, "emails": 0, "history": 0 } });
});

Meteor.publish("friends", function () {
    return Users.find({ friends: { "$in": [ this.userId ] } }, { fields: { "services": 0, "friends": 0, "requests": 0, "invites": 0, "emails": 0, history: 0 } });
});

Meteor.publish("currentPlayer", function (user) {
    if (!user)
        return;
    var id = (typeof user == "object") ? user._id : user;
    return Users.find({_id: id}, { fields: { "services": 0, "friends": 0, "requests": 0, "invites": 0, "emails": 0 } });
});

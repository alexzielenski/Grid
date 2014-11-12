var playerKey = function () {
    var key = keyForUser(this, Meteor.userId());
    return key ? key : "initiator";
};

var opponentKey = function () {
    return (playerKey.call(this) == "target") ? "initiator" : "target";
};

var player = function(key, options) {
    var down   = options.hash.down;

    var board  = this;
    var player = board[key];

    if (!player)
        return "";

    if (player.id == Meteor.userId())
        return down ? "you" : "You";

    if (player) {
        var user = Users.findOne(player.id);
        if (user && user.profile)
            return user.profile.name;
    }
    return "";
};

Template.playGame.events = {
    "click #forfeitButton": function (e, template) {
        e.preventDefault();
        var me = this;
        var dialog = $("#forfeitDialog");

        if (!dialog.length) {
            UI.renderWithData(Template.modal, {
                primaryStyle: "danger",
                header: "You sure?",
                message: "Only losers forfeit, are you a loser?",
                primaryButton: "Yes, I am a loser.",
                otherButton: "Certainly not",
                callback: function () {

                    Meteor.call("forfeit", Session.get("currentBoardID"));
                },
                idName: "forfeitDialog"
            }, document.body);

            dialog = $("#forfeitDialog");
        }

        Meteor.defer(function () {
            dialog.modal("show");
        });
    },
    "click #rematchButton": function (e, template) {
        Meteor.call("invite", this[opponentKey.call(this)].id, false, function (error, id) {
            if (error)
                throwError(error.reason);
        });
    },
    "click #publicityButton": function (e, template) {
        e.preventDefault();
        Meteor.call("togglePublicity", this._id);
    }
};

Template.playGame.helpers({
    turnText: function () {
        var currentPlayer = this[this.turn];
        var name = player.call(this, this.turn, { hash: { down: true } });

        if (currentPlayer.id == Meteor.userId())
            return name + "r";

        if (name.length) {
            return name + "'s";
        }

        return "";
    },
    winText: function () {
        if (this.winner && this[this.winner]) {
            var name = player.call(this, this.winner, {hash: {}});

            var winText = "<strong>" + name + "</strong>" + " won";

            return new Handlebars.SafeString(winText + "!");
        }
        return "";
    },
    loser: function () {
        return (this.winner) == "target" ? "initiator" : "target";
    },
    player: player,
    color: function (key) {
        return colorForPlayer(this, key);
    },
    opponentKey: opponentKey,
    playerKey: playerKey,
    colorClass: function(player) {
        var board  = this;
        var player = board[player];

        if (player) {
            var user = Users.findOne(player.id);
            if (user && user.profile) {
                if (user.profile.darkColor)
                    return "dark";
            }
        }
        return "";
    },
    playerId: function () {
        var key = playerKey.call(this);
        return this[key].id;
    },
    opponentId: function () {
        var key = opponentKey.call(this);
        return this[key].id;
    },
    isSpectating: function () {
        return (this.target.id != Meteor.userId() && this.initiator.id != Meteor.userId());
    }
});
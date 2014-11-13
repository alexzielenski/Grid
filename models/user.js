/*
    User representation
    createdAt: date
    history: { wins: [], losses: [], draws: [], active: [] }
    requests: { initiated: [], recieved: [] } // friend requests
    invites: { initiated: [], recieved: [] }
    profile: {
        name: string
        color: valid css string
        adjustedColor: generated as users are downloaded
    }
    friends: [ user_ids ]
    emails: [ { address: email, verified: true } ]
    color: valid css hex string
    record: { wins: int, losses: int, draws: int }
 */

Users = Meteor.users;

boardListOfUser = function (user, exclude) {
    if (!user)
        return [];

    if (!user.history)
        return [];

    if (!user.history.wins)
        user.history.wins = [];
    if (!user.history.draws)
        user.history.draws = [];
    if (!user.history.losses)
        user.history.losses = [];
    if (!user.history.active)
        user.history.active = [];

    var list = user.history.wins.concat(user.history.draws, user.history.losses, exclude ? [] : user.history.active);
    return list;
};

Meteor.methods({
    "unfriend": function (user_id) {
        if (!Meteor.isServer)
            return;
        var ids = [ this.userId, user_id ];
        var update = { $pullAll: { "friends": ids } };
        return Users.update({ _id: { $in: ids } }, update, { multi: true });
    }
});

if (Meteor.isClient) {
    varyColorFromColor = function(clr1, clr2) {
        clr1 = new Color(clr1);
        clr2 = new Color(clr2);

        function colorDistance(c1, c2) {
            var rmean = (c1.red() + c2.red()) / 2;
            var r     = c1.red() - c2.red();
            var g     = c1.green() - c2.green();
            var b     = c1.blue() - c2.blue();
            var wR    = 2 + rmean / 256.0;
            var wG    = 4.0;
            var wB    = 2 + (255 - rmean) / 256;
            return Math.sqrt(wR * r * r + wG * g * g + wB * b * b);
        }

        var dist  = colorDistance(clr1, clr2);
        var range = 100;
        var scale = 0.85;

        if (dist < range) {
            var delta = (range - dist / 1.25) * scale;
            if (!clr1.dark())
                delta *= -1;

            clr1.red(delta + clr2.red());
            clr1.green(delta + clr2.green());
            clr1.blue(delta + clr2.blue());
        }

        clr1.alpha(1);
        clr2.alpha(1);

        return [ clr1, clr2 ];
    };


    Users._transform = function (user) {
        // adjust the color, boy
        if (user._id != Meteor.userId() && !user.profile.adjustedColor) {

            var colors  = varyColorFromColor(user.profile.color, Meteor.user().profile.color);
            var theirs  = colors[0];

            user.profile.darkColor = theirs.dark();
            user.profile.adjustedColor = theirs.hslString();

        } else if (user._id == Meteor.userId()) {
            var clr = new Color(user.profile.color);
            clr.alpha(1);

            user.profile.darkColor = clr.dark();
            user.profile.color = clr.hslString();
        }

        if (!user.history)
            user.history = {};
        if (!user.history.wins)
            user.history.wins = [];
        if (!user.history.draws)
            user.history.draws = [];
        if (!user.history.losses)
            user.history.losses = [];

        if (!user.record)
            user.record = {};
        if (!user.record.wins)
            user.record.wins = user.history.wins.length;
        if (!user.record.losses)
            user.record.losses = user.history.losses.length;
        if (!user.record.draws)
            user.record.draws = user.history.draws.length;

        user.ratio = function () {
            var wins   = this.record.wins;
            var losses = this.record.losses;
            return wins / losses;
        }

        if (user._id == Meteor.userId()) {
            user.profile.adjustedColor = user.profile.color;
        }

        return user;
    }
}

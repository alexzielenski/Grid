/**
 * Created by Alex on 11/7/14.
 */
var userSub;
var activeSub;
var recentSub;
var friendSub;
var enemySub;
var searchSub;

Tracker.autorun(function () {
    if (Meteor.userId()) {
        userSub   = Meteor.subscribe("user");
        activeSub = Meteor.subscribe("activeBoards");
        recentSub = Meteor.subscribe("finishedBoards");
        friendSub = Meteor.subscribe("friends");
        enemySub  = Meteor.subscribe("opponents", Meteor.userId());
    } else if (Router.routes["welcome.index"]) {
        Router.go("welcome.index");
    }
});

Tracker.autorun(function() {
    if (Meteor.userId()) {
        searchSub = Meteor.subscribe("userSearch", Session.get("findUserQuery"));
    }
});


Router.configure({
    layoutTemplate: "layout",
    loadingTemplate: "loading"
});

Router.route("/", {
    name: "play.index",
    waitOn: function() {
        return [ userSub, activeSub, recentSub, enemySub ];
    },
    data: function() {
        var finished = Boards.find({ $or: [ { "target.id": Meteor.userId(), winner: { $exists: true } }, { "initiator.id": Meteor.userId(), winner: { $exists: true } } ] }, { sort: { finishedAt: -1 }, skip: 0, limit: 12 }).fetch();
        var active = Boards.find({ $or: [ { "target.id": Meteor.userId(), winner: { $exists: false } }, { "initiator.id": Meteor.userId(), winner: { $exists: false } } ] }, { sort: { updatedAt: -1 } }).fetch();

        return { activeBoards: active, finishedBoards: finished };
    }
});

Router.route("/account", {
    name: "play.account",
    waitOn: function () {
        return [userSub, enemySub];
    },
    data: function() {
        return Meteor.user();
    }
});

Router.route("/players", {
    name: "play.players",
    action: function(a, b, c) {
        Session.set("findUserQuery", this.params.query.search);
        Session.set("filterFriends", this.params.query.filter);
        this.render();
    },
    waitOn: function() {
        var ar = [ userSub, friendSub ];
        return ar;
    },
    data: function () {
        if (!Meteor.userId()) {
            return { players: [] };
        }

        if (!Meteor.user()) {
            return { players: [] };
        }

        if (!Meteor.user().friends) {
            return { players: [] };
        }

        var query = Session.get("filterFriends");
        if (query && query.length) {
            var expression = new RegExp(".*" + query + ".*", "i");

            return { players: Users.find({ $or: [ { "profile.name": expression }, { "emails.address": expression } ] }).fetch(), filter: query };
        }

        return { players: Users.find({ _id: { $in: Meteor.user().friends }}).fetch() };
    }
});

Router.route("/play/:_id", {
    name: "play.game",
    waitOn: function () {
        return [ userSub, Meteor.subscribe("board", this.params._id) ];
    },
    data: function () {
        return Boards.findOne(this.params._id);
    }
});


Router.route("/players/:_id", {
    name: "player.detail",
    waitOn: function () {
        return [ userSub, Meteor.subscribe("opponents", this.params._id), Meteor.subscribe("currentPlayer", this.params._id) ];
    },
    data: function () {
        var user = Users.findOne(this.params._id);
        if (this.params.rival) {
            var condition = { opponent: this.params.rival };
            var wins   = _.where(user.history.wins, condition);
            var losses =  _.where(user.history.losses, condition);
            var draws  =  _.where(user.history.draws, condition);
            var active =  _.where(user.history.active, condition);

            user.history.wins   = wins;
            user.history.losses = losses;
            user.history.draws  = draws;
            user.history.active = active;
        }

        return user;
    }
});

Router.route("/welcome", {
    name: "welcome.index"
});

Router.route("/welcome/how", {
    name: "welcome.how"
});

Router.onBeforeAction(function () {
    if (!Meteor.userId()) {
        this.redirect("welcome.index");
    } else {
        this.next();
    }
}, { except: ["welcome.index", "welcome.how"] });

Router.onAfterAction(function () {
    if (!Meteor.userId()) {
        NavigationItems.set([
            {"title": "Welcome", "path": "welcome.index"},
            { "title": "How to Play", "path": "welcome.how" }
        ]);
    } else {
        this.redirect("play.index");
    }
}, { only: ["welcome.index", "welcome.how"] });

Router.onAfterAction(function() {
    if (!Meteor.userId()) {
        this.redirect("welcome.index");
    } else {
        NavigationItems.set([
            {"title": "Home", "path": "play.index"},
            {"title": "Friends", "path": "play.players"},
            {"title": "Account", "path": "play.account"},
            {"title": "Sign Out", "action": function () {
                Meteor.logout();
            }}
        ]);
    }
}, { except: ["welcome.index", "welcome.how"] });
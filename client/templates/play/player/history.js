/**
 * Created by Alex on 11/7/14.
 */
var template = Template.playerHistory;
var perPage = 10;

pagKey = function (id) {
    return "gameHistory" + id;
}

/*
getPage = function (id, create) {
    var page = Pagination.get(pagKey(id));
    if (!page && create)
        page = new Pagination(pagKey(id), { perPage: perPage });
    return page;
}

template.rendered = function () {
    var pagination = getPage(this.data._id, true);
};

template.destroyed = function () {
    Pagination.destroy(pagKey(this.data._id));
};

template.pager = function () {
    var page = getPage(this._id, true);
    var board_ids = this.history.wins.length + this.history.losses.length + this.history.draws.length;
    return page.create(board_ids);
};*/

template.events({
    "click table.collapsing-table tbody tr": function (e, template) {
        // don't interfere with links
        if (e.target.nodeName != "A") {
            e.preventDefault();
            Router.go("play.game", { _id: this.id });
        }
    }
});

template.helpers({
    player: function (id, options) {
        var down   = options.hash.down;

        if (!id)
            return "";

        if (id == Meteor.userId())
            return down ? "you" : "You";

        var user = Users.findOne(id);
        if (user && user.profile)
            return user.profile.name;

        return "";
    },
    outcome: function (game) {
        if (!game.finishedAt)
            return "-";

        var user = this;
        var base = "<span class=\"";
        var cls  = "";
        var text = "";

        if (_.contains(_.pluck(user.history.draws, "id"), game.id)) {
            text = "D";
            cls  = "draw";
        } else if (_.contains(_.pluck(user.history.wins, "id"), game.id)) {
            text = "W";
            cls  = "win";
        } else if (_.contains(_.pluck(user.history.losses, "id"), game.id)) {
            text = "L";
            cls  = "loss";
        }

        return new Handlebars.SafeString(base + cls + "\">" + text + "</span>");
    },
    moveCount: function () {
        var tiles = this[otherPlayer(this.turn)].tiles;
        if (tiles)
            return { amt: tiles.length };
        return { amt: 0 };
    },
    history: function () {
        //var page = getPage(this._id, true);

        //var restriction = page.skip();

        //if (!restriction)
        //    restriction = { skip: 0, limit: perPage};

        var history = boardListOfUser(this).sort(function (x, y) {
                var dX = x.finishedAt ? x.finishedAt : new Date();
                var dY = y.finishedAt ? y.finishedAt : new Date();
                return dX > dY ? - 1 : dX < dY ? 1 : 0;
            }
        );
        return history;//.splice(restriction.skip, restriction.limit);
    },
});

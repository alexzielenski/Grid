/**
 * Created by Alex on 11/7/14.
 */
var template = Template.playerHistory;
var perPage = 10;

template.created = function() {
    this._pagination = new Pagination(1, 0);
}

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
    pagerData: function() {
        return Template.instance()._pagination.renderData();
    },
    player: function (id, options) {
        var down = options.hash.down;

        if (!id)
            return "";

        if (id == Meteor.userId())
            return down ? "you" : "You";

        var user = Users.findOne(id);
        if (user && user.profile)
            return user.profile.name;

        return "";
    },
    //!TODO: move this logic to history.html
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

        return new Spacebars.SafeString(base + cls + "\">" + text + "</span>");
    },
    history: function () {
        var restriction = Template.instance()._pagination.skip();

        var history = boardListOfUser(this).sort(function (x, y) {
                var dX = x.finishedAt ? x.finishedAt : new Date();
                var dY = y.finishedAt ? y.finishedAt : new Date();
                return dX > dY ? - 1 : dX < dY ? 1 : 0;
            }
        );


        Template.instance()._pagination.setTotalItems(history.length);

        return history.splice(restriction.skip, restriction.limit);
    },
});

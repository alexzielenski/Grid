var template = Template.playPlayers;

template.rendered = function () {
    console.log(this.data);
    $("#playersSearchField").val(this.data.filter);
};

template.helpers({
    matchmade: function () {
        var user = Meteor.user();
        if (!user || !user.invites || !user.invites.initiated)
            return false;

        var sent = _.pluck(user.invites.initiated, "open");

        if (_.contains(sent, true))
            return true;

        return false;
    },
    playersLoaded: function () {
        return Meteor.friendsSubscription.ready();
    },

});

template.events({
    "click tbody tr button.inviteBox": function (e) {
        e.preventDefault();
        var l = Ladda.create(e.target.nodeName == "BUTTON" ? e.target : e.target.parentNode);

        l.start();
        if ($(e.target).parents("tr#randomOpponent").length) {
            Meteor.call("openInvite", this._id, function (error, rtn) {
                l.stop();
                if (error) {
                    throwError(error.reason);
                }
            });
        } else {
            Meteor.call("invite", this._id, false, function (error, rtn) {
                l.stop();
                if (error) {
                    throwError(error.reason);
                }
            });
        }
    },
    "submit form.form-search #playerFilter": function (e, instance) {
        e.preventDefault();
        console.log("search");
        var query = $("#playersSearchField").val();
        Session.set("friendFilter", query);

        if (history.pushState) {
            var newurl = window.location.protocol + "//" + window.location.host + window.location.pathname + "?search=" + query;
            window.history.pushState({path:newurl},'',newurl);
        }
    },
    "click tbody tr": function (e, template) {
        e.preventDefault();
        var tag = $(e.target).prop("tagName");
        if (tag != "BUTTON" && tag != "SPAN")
            Router.go("player.detail", { _id: this._id });
    }
});
/*
Template.playerSearch.helpers({
    searchResults: function () {
        var query = Session.get("findUserQuery");
        if (query && query.length) {
            var expression = new RegExp(".*" + query + ".*", "i");

            return Users.find({ _id: { $not: Meteor.userId() }, "friends": { $not: { $in: [ Meteor.userId() ] } }, $or: [ { "profile.name": expression }, { "emails.address": expression } ] });
        }
        return undefined;
    }
});

Template.playerSearch.events({
    "click a.addButton": function (e, template) {
        Meteor.call("invite", this._id, true, function (error, res) {
            if (error)
                throwError(error.reason);
        });
    }
});

Template.searchModal.events({
    "submit form": function (e, template) {
        e.preventDefault();
        var query = $("#findUserQuery").val();
        Session.set("findUserQuery", query);
    }
});*/

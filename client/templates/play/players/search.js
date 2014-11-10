Template.playerSearch.helpers({
    searchResults: function () {
        var query = Session.get("findUserQuery");
        if (query && query.length) {
            var expression = new RegExp(".*" + query + ".*", "i");
            return Users.find({
                _id: { $not: Meteor.userId() },
                "friends": { $not: { $in: [ Meteor.userId() ] } },
                $or: [ { "profile.name": expression }, { "emails.address": expression } ] });
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

        if (history.pushState) {
            var newurl = window.location.protocol + "//" + window.location.host + window.location.pathname + "?search=" + query;
            window.history.pushState({path:newurl},'',newurl);
        }

    }
});
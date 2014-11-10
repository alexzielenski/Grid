/**
 * Created by Alex on 11/7/14.
 */
var template = Template.playIndex;

template.helpers({
    showInvites: function () {
        var user = Meteor.user();
        if (user.invites)
            return (user.invites.initiated.length > 0 || user.invites.received.length > 0);
        return [];
    }
});

template.events({
    "click .next": function () {
        var currentPage = Session.get("finishedBoardsPage");
        Session.set("finishedBoardsPage", currentPage + 1);
    },
    "click .previous": function () {
        var currentPage = Session.get("finishedBoardsPage");
        if (currentPage > 0)
            Session.set("finishedBoardsPage", currentPage - 1);
    }
});
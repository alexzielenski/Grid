/**
 * Created by Alex on 11/7/14.
 */
var template = Template.playIndex;

template.created = function() {
    var me = this;
    this._pagination = new Pagination(1, 0);
    this._pagination.perPage.set(12);

    Tracker.autorun(function() {
        Session.set("finishedBoardsPage", me._pagination.currentPage.get() - 1);
    });

    Tracker.autorun(function() {
        var record = Meteor.user().record;
        me._pagination.setTotalItems(record.wins + record.losses + record.draws);
    });
}

template.helpers({
    showInvites: function () {
        var user = Meteor.user();
        if (user.invites)
            return (user.invites.initiated.length > 0 || user.invites.received.length > 0);
        return [];
    },
    pagerData: function() {
        return Template.instance()._pagination.renderData();
    }
});

template.events({

});
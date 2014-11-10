/**
 * Created by Alex on 11/8/14.
 */
var template = Template.playerListItem;

template.helpers({
    inviteText: function () {
        var user = Meteor.user();

        if (!user || !user.invites || !user.invites.initiated)
            return undefined;

        var sent = _.pluck(user.invites.initiated, "opponent");

        if (_.contains(sent, this._id))
            return "Invite Sent!";

        if (!user || !user.invites || !user.invites.received)
            return undefined;

        var received = _.pluck(user.invites.received, "opponent");
        return _.contains(received, this._id) ? "Invite Received!" : undefined;
    }
});
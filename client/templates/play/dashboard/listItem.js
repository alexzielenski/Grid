/**
 * Created by Alex on 11/7/14.
 */
var template = Template.dashboardListItem;

template.helpers({
    opponent: function (options) {
        var opponentId;
        if (this.initiator.id != Meteor.userId())
            opponentId = this.initiator.id;
        else
            opponentId = this.target.id;

        return Users.findOne(opponentId);
    },
    outcomeStyle: function () {
        if (!this.finishedAt)
            return "";
        if (this.draw)
            return "color: #777; font-weight: 500;";
        if (keyForUser(this, Meteor.userId()) == this.winner)
            return "color: green; font-weight: 500;";
        return "color: red; font-weight: 500;";
    },
    userKey: function () {
        return keyForUser(this, Meteor.userId());
    },
    editClass: function () {
        if (this.turn == keyForUser(this, Meteor.userId()) && !this.finishedAt) {
            return "edit";
        }
        return "";
    }
});

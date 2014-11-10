Template.invite.events({
    "click a[name^='accept']": function(e, template) {
        var l = Ladda.create(e.target.nodeName == "A" ? e.target : e.target.parentNode);
        l.start();

        Meteor.call((template.data.friendRequest ? "acceptRequest" : "accept"), template.data.id, function (error, rtn) {
            if (error) {
                l.stop();
                throwError(error.reason);
            }
        });
    },
    "click a[name^='decline']": function(e, template) {
        var l = Ladda.create(e.target.nodeName == "A" ? e.target : e.target.parentNode);
        l.start();

        Meteor.call("decline", template.data.id, function (error, rtn) {
            if (error) {
                l.stop();
                throwError(error.reason);
            }
        });
    },
    "click a[name^='rescind']": function(e, template) {
        var l = Ladda.create(e.target.nodeName == "A" ? e.target : e.target.parentNode);
        l.start();

        Meteor.call("decline", template.data.id, function (error, rtn) {
            if (error) {
                l.stop();
                throwError(error.reason);
            }
        });
    }
});

Template.invite.helpers({
    participants: function() {
        var initiator = undefined;
        var opponent  = undefined;

        if (this.target) {
            initiator = this.opponent;
            opponent = Meteor.userId();
        } else {
            initiator = Meteor.userId();
            opponent = this.opponent;
        }

        return { "initiator": Users.findOne(initiator), "opponent": Users.findOne(opponent) };
    },
    computedName: function (user, invite, options) {
        if (!invite.target && !user && invite.open) {
            return options.hash.down ? "a random opponent" : "a random opponent";
        }

        if (Meteor.user()._id == user._id) {
            return options.hash.down ? "you" : "You";
        }

        if (user && user.profile && user.profile.name)
            return user.profile.name;
        return "Err";
    },
    type: function (ctx, options) {
        if (!this.target)
            return "success";
        return "info";
    }
});
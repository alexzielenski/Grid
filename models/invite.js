Invites = new Meteor.Collection("invites");

/*
    Invites
    initiator: user id
    target: user id
 */

Invites.allow({
    insert: function (userId, invite) {
        return (invite.initiator != userId);
    },
    update: function (userId, invite, fields, modifier) {
        return false;
    },
    remove: function (userId, invite) {
        return (invite.initiator == userId || invite.target == userId);
    }
});

Meteor.methods({
    openInvite: function () {
        // Look for other open invitations
        // if there are none, create one
        if (!Meteor.isServer)
            return undefined;

        var existingInvite = Invites.findOne({ initiator: { $exists: true, $ne: this.userId }, target: null, open: true });
        if (existingInvite) {
            return Meteor.call("accept", existingInvite);
        }

        existingInvite = Invites.findOne({ initiator: Meteor.userId(), target: null, open: true });
        if (existingInvite)
            throw new Meteor.Error(400, "An open invitation already exists for this user.");

        var invite = {
            initiator: this.userId,
            target: null,
            open: true,
            createdAt: new Date(),
            friendRequest: false
        };

        var inviteID = Invites.insert(invite);
        Users.update(invite.initiator, { $addToSet: { "invites.initiated": { id: inviteID, opponent: null, open: true } } });
        return inviteID;
    },
    invite: function (target, friendRequest) {
        var me = this;
        if (target == this.userId)
            throw new Meteor.Error(400, "Target of invite cannot be yourself.");
        if (!(typeof target == "string" && target.length))
            throw new Meteor.Error(400, "Invalid parameters.");
        if (!this.userId)
            throw new Meteor.Error(403, "You must be logged in.");
        if (!friendRequest)
            friendRequest = false; // make sure its not null or undefined

        if (friendRequest && _.contains(Meteor.user().friends, target)) {
            throw new Meteor.Error(400, "Target is already your friend.");
        }

        if (!Meteor.isServer)
            return undefined;

        var existingInvite = Invites.findOne({ $or: [ { initiator: this.userId, target: target, friendRequest: friendRequest }, { initiator: target, target: this.userId, friendRequest: friendRequest } ] });

        if (existingInvite) {
            if (existingInvite.target == this.userId)
                return Meteor.call("accept" + (friendRequest ? "Request" : ""), existingInvite);
            throw new Meteor.Error(400, "A pending invite between these two players already exists!");
        }


        var invite = {
            initiator: this.userId,
            target: target,
            createdAt: new Date(),
            friendRequest: friendRequest
        };

        var inviteID = Invites.insert(invite);

        var initiatedKey = (friendRequest ? "requests" : "invites") + ".initiated";
        var receivedKey = (friendRequest ? "requests" : "invites") + ".received";

        var initiatorUpdate = { $addToSet: {} };
        var targetUpdate    = { $addToSet: {} };

        initiatorUpdate.$addToSet[initiatedKey] = { id: inviteID, opponent: invite.target, friendRequest: friendRequest, createdAt: invite.createdAt };
        targetUpdate.$addToSet[receivedKey]     = { id: inviteID, opponent: invite.initiator, target: true, friendRequest: friendRequest, createdAt: invite.createdAt };

        Users.update(invite.initiator, initiatorUpdate);
        Users.update(invite.target, targetUpdate);

        return inviteID;
    },
    accept: function (invite) {
        if (!Meteor.isServer)
            return;

        if (!this.userId)
            return;

        if (typeof invite == "string")
            invite = Invites.findOne(invite);

        if (!invite)
            throw new Meteor.Error(400, "Cannot accept nonexistent invite");

        if (invite.friendRequest)
            throw new Meteor.Error(400, "You cannot make a board from a friend request!");

        if (invite.open && !invite.target) {
            invite.target = Meteor.userId();
        }

        if (invite.target != this.userId)
            throw new Meteor.Error(400, "You cannot accept an invite not directed towards to!");

        if (invite.target == invite.initiator) {
            Invites.remove(invite._id);
            throw new Meteor.Error(500, "This invite should NOT exist.");
        }

        var board = {
            initiator: {
                id: invite.initiator,
                tiles: []
            },
            target: {
                id: invite.target,
                tiles: []
            },
            turn: "target",
            tall: 6,
            wide: 7,
            createdAt: new Date(),
            updatedAt: new Date(),
            random: invite.open ? true : false
        };

        var board_id = Boards.insert(board);

        if (board_id) {
            var update = { $addToSet: { "history.active": { id: board_id, opponent: board.target.id, createdAt: board.createdAt } }, $pull: { "invites.initiated": { id: invite._id }, "invites.received": { id: invite._id } } };
            // var select = { $or: [ { _id: board.initiator.id }, { _id: board.target.id } ] };

            Users.update(board.initiator.id, update);

            update.$addToSet["history.active"].opponent = board.initiator.id;
            Users.update(board.target.id, update);

            Invites.remove(invite._id);
        }

        return board_id;

    },
    acceptRequest: function (invite) {
        if (!Meteor.isServer)
            return;

        if (!this.userId)
            return;

        if (typeof invite == "string")
            invite = Invites.findOne(invite);

        if (!invite)
            throw new Meteor.Error(400, "Cannot accept nonexistent friend request.");

        if (!invite.friendRequest)
            throw new Meteor.Error(400, "This invite is not a friend request");

        if (invite.target != this.userId)
            throw new Meteor.Error(400, "You cannot accept a friend request not directed towards to!");

        if (invite.target == invite.initiator) {
            Invites.remove(invite._id);
            throw new Meteor.Error(500, "This invite should NOT exist.");
        }
        if (!invite)
            throw new Meteor.Error(400, "No invite supplied to accept.");


        var update = { $addToSet: { friends: invite.initiator }, $pull: { "requests.initiated": { id: invite._id }, "requests.received": { id: invite._id } } };
        Users.update(invite.target, update);
        update.$addToSet.friends = invite.target;
        Users.update(invite.initiator, update);

        return Invites.remove(invite._id);;
    },
    decline: function (invite) {
        if (!Meteor.isServer)
            return;

        if (typeof invite == "string")
            invite = Invites.findOne(invite);

        if (!invite)
            throw new MongoError(400, "Specified invite does not exist");

        var update = { $pull: { "invites.initiated": { id: invite._id }, "invites.received": { id: invite._id }, "requests.initiated": { id: invite._id }, "requests.received": { id: invite._id } } };

        var select = { $or: [ { _id: invite.initiator }, { _id: invite.target } ] };
        Users.update(select, update, { multi: true } );

        return Invites.remove(invite._id);
    }
});

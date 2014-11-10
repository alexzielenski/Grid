var ratio = function () {
    var base = "<span class=\"";
    var cls  = "";
    var text = this.ratio();

    if (text > 1)
        cls ="win";
    else if (text < 1)
        cls = "loss";
    else
        cls = "draw";

    text = text.toFixed(2);

    return new Handlebars.SafeString(base + cls + "\">" + text + " W/L" + "</span>");
};

Template.playerDetail.helpers({
    ratio: ratio,
    title: function () {
        var text = ratio.call(this);

        // the context (this) is ratio
        if (text >= 10)
            return "Godly";
        else if (text >= 5)
            return "Insane";
        else if (text >= 3)
            return "Expert";
        else if (text >= 2)
            return "Dedicated";
        else if (text >= 1.5)
            return "Good";
        else if (text >= 1.0)
            return "Average";
        else if (text >= 0.50)
            return "Noob";
        else if (text >= 0.25)
            return "Sad";

        return "Garbage";
    },
    friends: function () {
        if (this.friends)
            return this.friends.indexOf(Meteor.userId()) != -1;
        return false;
    },
    isFriend: function () {
        var user = Meteor.user();
        if (!user)
            return false;
        return _.contains(user.friends, this._id);
    },
    requestSent: function () {
        var user = Meteor.user();
        if (!user)
            return false;

        var ctx = this;
        var initiated = user.requests.initiated;
        return _.some(initiated, function (obj) {
            return obj.opponent == ctx._id;
        });
    },
    count: function (obj) {
        if (!obj)
            return { amt: 0 };
        return { amt: obj.length };
    }
});

/*
Template.playerDetail.count = function (path) {
    var obj = this[path];
    if (!obj)
        return 0;
    if (obj.count)
        return obj.count();
    return obj.length;
};
*/
Template.playerDetail.events({
    "click ul.dropdown-menu li a": function (e, template) {
        e.preventDefault();
        var target = $(e.target);
        var action = target.attr("name");

        var method = "";
        var args   = [];

        switch (action) {
            case "invite":
                method = "invite";
                args = [ this._id, false ];
                break;
            case "unfriend":
                method = "unfriend";
                args = [this._id];
                break;
            case "friend":
                method = "invite";
                args = [ this._id, true ];
                break;
            case "report":
                console.log("report " + this._id);
                break;
        }

        if (method.length) {
            Meteor.apply(method, args, function (error, rtn) {
                if (error)
                    throwError(error.reason);
            });
        }
    }
});


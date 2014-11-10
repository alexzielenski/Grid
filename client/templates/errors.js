Template.errors.helpers({
    errors: function() {
        return Errors.find().fetch();
    }
});

Template.error.rendered = function() {
    var error = this.data;
    Meteor.defer(function() {
        Errors.update(error._id, {$set: {seen: true}});
    });
};

Template.error.events = {
    "click button.close": function (e) {
        e.preventDefault();
        Errors.remove(this._id);
    }
};

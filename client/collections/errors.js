Errors = new Meteor.Collection(null);

throwError = function (message) {
    var existing = Errors.find({ message: message });
    if (existing.count()) {
        existing.forEach(function (e) {
            Errors.update(e._id, { $inc: { repeat: 1 } });
        });
    } else {
        Errors.insert({ message: message, seen: false, repeat: 1 });
    }
};

clearErrors = function() {
    Errors.remove({seen: true});
};

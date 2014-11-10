/**
 * Created by Alex on 11/7/14.
 */
UI.registerHelper("date", function (ctx) {
    var date = new Date(ctx);
    return (date.getMonth() + 1) + "-" + date.getDate() + "-" + date.getFullYear();
});

UI.registerHelper('session',function(input){
    return Session.get(input);
});

UI.registerHelper("log", function (obj) {
    console.log(obj);
    return "";
});

UI.registerHelper("equal", function (arg1, arg2, options) {
    return arg1 == arg2;
});

UI.registerHelper("not_equal", function (arg1, arg2, options) {
    return arg1 != arg2;
});

UI.registerHelper("not", function (arg1) {
    return !arg1;
});

UI.registerHelper("gt", function (arg1, arg2, options) {
    return parseFloat(arg1) > parseFloat(arg2);
})

UI.registerHelper("user", function (userID, options) {
    var keypath = options.hash.path;
    var user = Users.findOne(userID);

    if (!keypath)
        return user;

    var paths = keypath.split(".");
    var root = user;
    paths.forEach(function (path) {
        root = root[path];
    })
    return root;
});

UI.registerHelper("invite", function (inviteID, options) {
    return Invites.findOne(inviteID);
});

UI.registerHelper("board", function (boardID, options) {
    return Boards.findOne(boardID);
});

UI.registerHelper("plural", function (count, baseWord, options) {
    return (count != 1) ? baseWord + (options.hash.irregular ? options.hash.irregular : "s") : baseWord;
});

UI.registerHelper("toFixed", function(num, level) {
    return parseFloat(num).toFixed(parseInt(level));
})


UI.registerHelper('for', function(options) {
    var out = "";

    for (var i = options.hash.start; i < options.hash.finish; i++) {
        out = out + options.fn(i);
    }

    return out;
});

UI.registerHelper('cond', function(condition, test, value, options) {
    return (condition == test) ? value : "";
});

UI.registerHelper("parent", function(options) {
    console.log(options);
    return Template.parentData(options.hash.level);
})

String.prototype.startsWith = function (check) {
    return (this.substring(0, check.length) === check);
}

/**
 * Created by Alex on 11/7/14.
 */
Array.prototype.first = function () {
    return this[0];
};

Template.playAccount.rendered = function() {
    var picker = $("#colorPicker");
    var color = Meteor.user().profile.color;

    if (color) {
        var format = color.startsWith("#") ? "hex" : "rgb";

        if (color.startsWith("hsl"))
            format = "hsl";

        picker.colorpicker({
            "format": format
        }).on('changeColor', function(ev){
            $("i#colorPreview").css("background-color", ev.color.toHex());
        });
    }
};

Template.playAccount.destroyed = function() {
    this.$("#colorPicker").colorpicker("destroy");
}


Template.playAccount.events({
    "click #saveAccountButton": function (e) {
        e.preventDefault();
        console.log("save");
        var displayName = $("input#displayName").val();
        var color       = $("input#colorPicker").val();

        //var l = Ladda.create(e.target.nodeName == "BUTTON" ? e.target : e.target.parentNode);
        //console.log(l);
        //l.start();

        Users.update(Meteor.userId(), { $set: { "profile.name": displayName, "profile.color": color } }, function (e) {
            //l.stop();
            //l.remove();
            console.log("updated");
            if (e) {
                throwError(e);
            }
        });
    },

    "click #deleteAccountButton": function (e) {
        e.preventDefault();
        console.log("delete");
        var l = Ladda.create(e.target.nodeName == "BUTTON" ? e.target : e.target.parentNode);
        l.start();
    },

    "keypress form": function (e) {
        if ((e.which && e.which == 13) || (e.keyCode && e.keyCode == 13)) {
            $("button#saveAccountButton").click();
            return false;
        } else {
            return true;
        }
    }
});
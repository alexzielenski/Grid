Template.modal.helpers({
    otherClass: function () {
        if (this.otherStyle && this.otherStyle.length)
            return "btn-" + this.otherStyle;
        return "btn-default";
    },
    primaryClass: function () {
        if (this.primaryStyle && this.primaryStyle.length)
            return "btn-" + this.primaryStyle;
        return "btn-primary";
    }
});

Template.modal.events({
    "click button.defaultButton": function (e, template) {
        e.preventDefault();

        $(e.target).parent().parent().modal("hide");

        if (template.data.callback)
            template.data.callback(true, e);
    },
    "submit": function (e) {
        e.preventDefault();
        console.log("submit");
    }
});

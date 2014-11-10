/**
 * Created by Alex on 11/7/14.
 */

NavigationItems = new ReactiveVar([]);

Template.navigation.helpers({
    selected: function(path) {
        return (Router.current().route.getName() === path) ? "active" : "";
    },
    items: function(path) {
        return NavigationItems.get();
    }
});

Template.navigation.events({
    "click a": function (e) {
        // Even though the href is set, prevent default to save us some requests and latency
        e.preventDefault();

        if (this.path)
            Router.go(this.path);

        if (this.action) {
            this.action();
        }
    }
});
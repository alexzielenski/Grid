/**
 * Created by Alex on 11/7/14.
 */
Template.welcomeIndex.helpers.canSignIn = function() {
    return Accounts.loginServicesConfigured();
};

Template.welcomeIndex.events({
    "click a#googleSignIn": function (e) {
        e.preventDefault();
        Meteor.loginWithGoogle({
            requestPermissions: ["openid", "profile", "email"]
        });
    },
    "click a#facebookSignIn": function (e) {
        e.preventDefault();
        Meteor.loginWithFacebook({
            requestPermissions: ["email"]
        });
    }
});
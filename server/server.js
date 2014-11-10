Meteor.startup(function () {
    ServiceConfiguration.configurations.remove({service: "google"});
    ServiceConfiguration.configurations.insert({
        service: "google",
        clientId: "571833737062",
        secret: "HA6KRaOwwGQkFQ07JFrBOf07"
    });


    ServiceConfiguration.configurations.remove({ service: "facebook" });
    ServiceConfiguration.configurations.insert({
        service: "facebook",
        appId: "384264588326319",
        secret: "44e0b0c468b520256da08bda33a8f7c9"
    });
    console.log("configured");

    Accounts.onCreateUser(function (options, user) {
        if (options.profile)
            user.profile = options.profile;
        if (!user.emails)
            user.emails = [];

        if (!user.profile)
            user.profile = {};

        for (var key in user.services) {
            var service = user.services[key];
            if (service.email) {
                user.emails.push({ address: service.email, verified: true });
            }
        }

        function randomClr() {
            return Math.floor(Math.random() * 256);
        }

        user.invites            = {};
        user.invites.initiated  = [];
        user.invites.received   = [];

        user.friends            = [];
        user.requests           = {};
        user.requests.initiated = [];
        user.requests.received  = [];

        user.history            = {};
        user.history.wins       = [];
        user.history.losses     = [];
        user.history.draws      = [];
        user.profile.color      = "rgb(" + randomClr() + "," + randomClr() + "," + randomClr() + ")";

        return user;
    });
});

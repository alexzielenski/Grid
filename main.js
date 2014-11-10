//Pages = new Meteor.Pagination("Boards", {
//    perPage: 10,
//    sort: {
//        finishedAt: -1,
//        createdAt: -1
//    },
//    router: "iron-router",
//    fastRender: true,
//    auth: function(skip, subscription) {
//        return {
//            $or: [
//                { "target.id": subscription.userId, winner: { $exists: true } },
//                { "initiator.id": subscription.userId, winner: { $exists: true } } ] },
//        { sort: { finishedAt: -1 }, skip: skip};
//    }
//    }
//});
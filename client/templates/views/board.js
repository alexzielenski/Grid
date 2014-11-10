/**
 * Created by Alex on 11/8/14.
 */
Template.board.created = function () {
    this._creationDate       = new Date();
    this._itemWidth          = 0;
    this._itemHeight         = 0;
    this._lastTile           = new ReactiveVar(undefined);
    this._highlightedColumn  = new ReactiveVar(-1);
    this._parentSize         = { width: 0, height: 0 };

    // Setting this to true always makes it do the cool animation on the dashboard
    // thank god i made this dynamic like a boss
    this._shouldAnimate      = true;// onPage("playGame");
    this._tileCount          = -1;
};

Template.board.destroyed = function () {
    if (this.__drawValidator)
        this._drawValidator.stop();
    if (this.__lastTileValidator)
        this._lastTileValidator.stop();
};

Template.board.rendered = function () {
    var me = this;

    Tracker.autorun(function (c) {
        // create a dependency on lastTile
        var col = me._highlightedColumn.get();
        me._drawValidator = c;
        draw.call(me);
    });

    Tracker.autorun(function (c) {
        // create a dependency on lastTile

        // for some reason this is firing when the last tile is the same
        // even though its a functionality of the reactive var
        if (me._previousTile == me._lastTile.get()) {
            return;
        }

        me._previousTile = me._lastTile.get();
        me._lastTileValidator = c;
        animate.call(me);
    });

    this.autorun(function() {
        var me = this.templateInstance();

        var data      = me.data;
        var turn      = data.turn;
        var prev      = turn == "target" ? "initiator" : "target";
        var tiles     = data[prev].tiles;
        var lastTile  = tiles ? tiles[tiles.length - 1] : 0;
        var tileCount = 0;

        if (data.target && data.initiator && data.target.tiles && data.initiator.tiles)
            tileCount = data["target"].tiles.length + data["initiator"].tiles.length;

        if (me._shouldAnimate
            && data.updatedAt > me._creationDate
            && tileCount > me._tileCount
            && !me._isAnimating) {
            me._tileCount = tileCount;
            me._lastTile.set(lastTile);
        } else {
            // I am removing this line because sometimes when you
            // make a move yourself the simulation runs and returns data
            // but if the simulation returns data that is different from the data
            // that the server returns later, rendered is called again and the
            // animation never occurs

            // me._lastTile = undefined;
            draw.call(me);
        }

        me._tileCount = tileCount;
    });
};

var onPage = function(page) {
    return Router.current().route.getName() == page;
}

var columnForPoint = function (point) {
    var col = parseInt(Math.floor(point.x / this._itemWidth));
    if (col < this.data.wide)
        return col;
    return -1;
};

var isSpectating =  function () {
    return !involvedInGame(this, Meteor.userId());
};

Template.board.helpers({
    clickable: function() {
        // all boards should have the pointer cursor except finished ones on the game page
        if (onPage("play.game"))
            return (!this.finishedAt && !isSpectating.call(this)) ? "clickable" : "";
        return "clickable";
    },
    isSpectating: isSpectating
});

Template.board.events({
    //!TODO: get this onPage logic out of here
    "mousemove canvas.board": function (e, template) {
        if (onPage("play.game") && !this.finishedAt && !isSpectating.call(this)) {
            // translate it to our bounds
            var node = $(e.target);
            var x = e.pageX - node.offset().left;
            var y = e.pageY - node.offset().top;

            var mousePoint = { x: x, y: y };

            // if our mouse switched columns, trigger the reaction
            template._highlightedColumn.set(columnForPoint.call(template, mousePoint));
        } else if (onPage("play.game")) {
            // game is either over or the mouse is in hell
            // either way, remove the column and trigger
            // reactivity
            template._highlightedColumn.set(-1);
        }
    },
    "mouseout canvas.board": function (e, template) {
        template._highlightedColumn.set(-1);
    },
    "click canvas.board": function (e, template) {
        if (onPage("play.game") && !this.finishedAt && !isSpectating.call(this)) {
            e.preventDefault();

            // use the highlighted column to determine where we are moving to.
            Meteor.call("move", this, template._highlightedColumn.get(), function (error, id) {
                if (error)
                    throwError(error.reason);
            });
        }
    }
});

function animate () {
    var me = this;

    // dont draw with any data
    if (!me.data)
        return;

    // we can't animate without a tile or on the wrong page
    if (typeof me._lastTile.get() === "undefined" || !me._shouldAnimate) {
        return;
    }

    var lastTile = me._lastTile.get();

    // only do this if we can get a color
    var clr = colorForPlayer(me.data, ownerAtIndex(me.data, lastTile));
    if (!clr)
        return;

    // wait for the next tick
    draw.call(me);

    var $canvas  = $(me.find("canvas.board"));
    // estimate where the piece would usually go in the board. It doesn't have to be exact, just close
    var destX = me._itemWidth * (lastTile % me.data.wide);

    // add one to accomodate how we are starting one item below the board
    var destY = me._itemHeight * (Math.floor(lastTile / me.data.wide) + 1) - 1;

    var canvasHeight = me._itemHeight * me.data.tall;

    var initialY = -1 * me._itemHeight;

    // create a fake element to animate
    var elementID = "__tileAnimator";
    var element = $("#" + elementID);
    if (!element[0]) {
        element = $("<canvas>").attr({id: elementID});
        element.prependTo($canvas.parent());
        // put the element on the parent element of the actual canvas
        // this will place us directly below the parent where we want to be

        var world = anima.world();
        world.add(element.get(0));
    } else {
        // wait current animation of its occuring
        //element.stop();
        element.anima().finish(true);
    }

    var duration = 750 * (canvasHeight - destY + me._itemHeight) / canvasHeight;
    element.css({
        width: me._itemWidth - 1,
        height: me._itemHeight - 1,
        position: "absolute",
        "top": initialY,
        "left": destX + 1,
        "z-index": 999
    });

    element.show();

    var tile  = element.get(0);
    var tilex = tile.getContext("2d");

    tilex.clearRect(0, 0, tile.width, tile.height);

    // just draw once the color of the user for the entire animation
    tilex.fillStyle = clr;
    tilex.fillRect(0, 0, tile.width, tile.height);

    // stroke the element for normalcy. Should really not be just copying
    // and pasting the stroke method from the other draw for maintainability
    tilex.strokeStyle = "#888888";
    tilex.lineWidth   = 1.0;

    // animate margin-top from above the canvas to the estimated Y position
    // all relative to (0, -me._itemHeight) of the board
    this._isAnimating = true;
    var fallDistance =  canvasHeight - destY + me._itemHeight;
    var animation = element.anima().animate({
        "translate": [0, fallDistance, 0]
    }, duration * 0.37, "ease-in-quad").animate({
        "translate": [0, -fallDistance * 0.25, 0]
    }, duration * 0.18, "ease-out-quad").animate({
        "translate": [0, fallDistance * 0.25, 0]
    }, duration * 0.18, "ease-in-quad").animate({
        "translate": [0, -fallDistance * 0.07, 0]
    }, duration * 0.09, "ease-out-quad").animate({
        "translate": [0, fallDistance * 0.07, 0]
    }, duration * 0.09, "ease-in-quad").animate({
        "translate": [0, -fallDistance * 0.02, 0]
    }, duration * 0.05, "ease-out-quad").animate({
        "translate": [0, fallDistance * 0.02, 0]
    }, duration * 0.04, "ease-in-quad");
    animation.css();
    animation.on("end", function(e) {
        me._lastTile.set(undefined);
        me._isAnimating = false;
        draw.call(me);
        element.hide();
    });
}

function draw() {
    var me = this;
    var $canvas = $(me.find("canvas.board"));
    var data   = me.data;
    var canvas = $canvas[0];

    if (!canvas)
        return;

    var ctx    = canvas.getContext("2d");

    // cache these colors
    // Remember: this method gets run often so there is
    // a huge increase in performance when we only run this method
    // once because it does searching through all of the user IDs
    // in the cache and then on the server to find the user
    // best to only do it once per user
    var colors = {
        "target": colorForPlayer(data, "target"),
        "initiator": colorForPlayer(data, "initiator")
    };

    // dont draw shit without colors
    if (!colors["target"] || !colors["initiator"])
        return;

    if (!ctx)
        return;

    // Autoresize to proportionally fit the container
    var parentWidth  = $canvas.parent().width();
    var parentHeight = $canvas.parent().height();

    // the board redraws pretty often so it is
    // helpful to do as little computation as possible
    if (me._parentSize.width != parentWidth || me._parentSize.height != parentHeight) {
        var squareSize = 0;

        if (data.wide > data.tall) {
            squareSize = Math.floor(parentWidth / data.wide);
        } else {
            squareSize = Math.floor(parentHeight / data.tall);
        }

        var newWidth = data.wide * squareSize;
        var newHeight = data.tall * squareSize;

        if (newWidth != canvas.width || newHeight != canvas.height) {
            // changing the canvas size everytime will
            // kinda destroy the element and cause the scroll to shift up
            canvas.width  = newWidth;
            canvas.height = newHeight;
        }

        this._itemWidth  = Math.floor(newWidth / data.wide);
        this._itemHeight = Math.floor(newHeight / data.tall);

        me._parentSize = { width: parentWidth, height: parentHeight };
    }

    var curX = 0;
    var curY = 0;

    // set up the stroke style
    ctx.strokeStyle = "#888888";
    ctx.lineWidth = 1;

    // html/javascript for some reason thinks it makes sense
    // to draw shit relative to the middle of the pixel
    var d = ctx.lineWidth / 2;

    // left border
    ctx.moveTo(d, 0);
    ctx.lineTo(d, canvas.height);

    // bottom border
    ctx.moveTo(0, canvas.height - d);
    ctx.lineTo(canvas.width, canvas.height - d);

    // right border
    ctx.moveTo(canvas.width - d, d);
    ctx.lineTo(canvas.width - d, canvas.height - d);

    // clear our drawing canvas
    ctx.clearRect(0, 0, canvas.width, canvas.height);

    // canvases have a point of origin in the top left so we have to traverse
    // our rows in reverse
    for (var row = data.tall - 1; row >= 0; row--) {
        curX = 0;

        for (var col = 0; col < data.wide; col++) {
            var idx = col + row * data.wide;
            var color = colors[ownerAtIndex(data, idx)];

            // fill the highlighted column
            if (col == this._highlightedColumn.get()) {
                ctx.fillStyle = "rgba(123,123,123,0.5)";
                ctx.fillRect(curX, curY, this._itemWidth, this._itemHeight);

                var lastColor = colors[ownerAtIndex(data, idx - data.wide)];
                if (color == undefined && (lastColor != undefined || row == 0) && !me._lastTile.get()) {
                    var borderRadius = Math.round(me._itemHeight / 25);

                    // draw the "preview"
                    ctx.fillStyle = colors[keyForUser(data, Meteor.userId())];
                    ctx.fillRect(curX + borderRadius, curY + borderRadius, this._itemWidth - borderRadius * 2, this._itemHeight - borderRadius * 2);
                }
            }

            // fill the block with our color
            if (!(idx == this._lastTile.get())) {// && this._isAnimating)) {
                if (color != undefined) {
                    ctx.fillStyle = color;
                    ctx.fillRect(curX, curY, this._itemWidth, this._itemHeight);

                }
            }

            curX += this._itemWidth;

            // Draw the grid line on the right
            ctx.moveTo(curX + d, curY);
            ctx.lineTo(curX + d, curY + this._itemHeight);
        }

        // Draw the grid line on the top
        ctx.moveTo(0, curY + d);
        ctx.lineTo(canvas.width, curY + d);

        curY += this._itemHeight;
    }


    ctx.stroke();
}
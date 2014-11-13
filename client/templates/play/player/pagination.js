// Takes argument with callback for current page
Pagination = function(currentPage, totalPages) {
    this.totalPages = new ReactiveVar(totalPages);
    this.currentPage = new ReactiveVar(currentPage);
    this.perPage = new ReactiveVar(10);
    this._pageRange = 1;
    this._maxButtons = 5;
};

Pagination.prototype.setTotalItems = function(count) {
    this.totalPages.set(Math.ceil(count / this.perPage.get()));

    if (this.totalPages.get() < this.currentPage.get() && this.totalPages.get() != 0) {
        this.currentPage.set(this.totalPages.get());
    }
}

Pagination.prototype.skip = function() {
    return { skip: (this.currentPage.get() - 1) * this.perPage.get(), limit: this.perPage.get() };
}

Pagination.prototype.renderData = function() {
    var me = this;
    var totalPages = me.totalPages.get();
    var currentPage = me.currentPage.get();

    var min = Math.max(currentPage - me._pageRange, 1);
    var max = Math.min(totalPages, min + me._pageRange * 2);
    if (totalPages < me._maxButtons) {
        min = 1;
        max = totalPages;
    }

    // Show the left arrow if there is an element before the first page
    var showLeft = min - 1 > 1;
    // Show the right arrow if there is an element after the last page
    var showRight = max + 1 < totalPages;

    // Show the left dots if the first page li does not represent the first page
    var leftDots = min != 1;
    // Show the right dots if the last page li does not represent the last page
    var rightDots = max != totalPages;

    // Show the first page if we are just one away from it
    if (leftDots && !showLeft && min - 1 == 1) {
        min = 1;
        leftDots = false;
    }

    // Show the last page if we are just one away from it
    if (rightDots && !showRight && max + 1 == totalPages) {
        max = totalPages;
        rightDots = false;
    }

    // Dont show the arrow and dots if there are two pages left
    if (leftDots && showLeft && min - 2  == 1) {
        min = 1;
        showLeft = false;
        leftDots = false;
    }


    // Dont show the arrow and dots if there are two pages left
    if (rightDots && showRight && max + 2 == totalPages) {
        max = totalPages;
        showRight = false;
        rightDots = false;
    }

    return {
        "min": min,
        "max": max,
        "leftDotPage": min - 1,
        "rightDotPage": max + 1,
        "showLeftArrow": showLeft,
        "showRightArrow": showRight,
        "showLeftDots": leftDots,
        "showRightDots": rightDots,
        "currentPage": currentPage,
        "totalPages": totalPages,
        callback: function(page) {
            me.currentPage.set(page);
        }
    };
}

Pagination.prototype.html = function() {
    return UI.toHTMLWithData(Template.pagination, this.renderData());
}

Template.pagination.helpers({
     numbers: function() {
         var ar = [];
         for (var i = this.min; i <= this.max; i++) {
             ar.push(i);
         }

         return ar;
     }
});

Template.pagination.events({
    "click li a": function(e, template) {
        template.data.callback($(e.target).data("page"));
    }
});
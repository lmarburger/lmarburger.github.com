(function($) {
  $(function() {
    var categories = $("#category_items > ol")
      .bind("reposition", reposition)
      .bind("clear", clearHighlighted);

    categories

      // Highlight clicked category.
      .find("a")
        .click(highlightCategory)
        .end()

      // Select checked category.
      .find(":checkbox")
        .click(selectCategory)
        .end()

      // Listen for some custom events.
      .find("li")
        .bind("highlight", [], categoryHighlighted)
        .bind("unhighlight", categoryUnhighlighted)
        .bind("select", categorySelected)
        .bind("deselect", categoryDeselected);


    // Move back through the category hierarchy.
    $("#back").click(moveBack);

    // Search
    var searchResults = $('<ol id="category_search" />')
      .hide()
      .appendTo($("#categories"));

    $("#search")
      .listSearch($("ol.root"))
      .bind("search", showMatches)
      .focus(function() {
        if (searchResults.children("li").length) {
          searchResults.show();
        }
      });

      // I'd like to hide the search results on blur, but
      // blur is also triggered on mousedown when clicking
      // on a result. That means the results are hidden before
      // click can fire. That doens't work so well.
      //.blur(function() {
        //window.setTimeout(function() {
          //if (searchResults.is(":visible")) {
            //searchResults.hide();
          //}
        //}, 10);
      //});


    /*************
     * Handlers
     *************/

    // Scroll the highlighted element into position.
    function reposition() {
      var
        highlightedLevels = categories.find(".highlighted"),
        leftmostLevel = highlightedLevels.length - 1,
        deepestHighlighted = highlightedLevels.eq(leftmostLevel);

      var
        left = Math.min(leftmostLevel * -310, 0),
        top = categoryTopPosition(deepestHighlighted);

      categories
        .animate({ left: left })
        .parent()
          .animate({ scrollTop: top });
    }

    // Clear all highlighted categories.
    function clearHighlighted() {
      $(this).find(".highlighted").trigger("unhighlight");
    }

    function categoryTopPosition(category) {
      var top = 0;
      if (category && category.length) {
        top = Math.ceil(category.offset().top - categories.offset().top);
      }

      return top;
    }

    // Highlight a category to show its children.
    function highlightCategory(e) {
      e.preventDefault();

      var parent = $(this).parent()
        .trigger("highlight")
        .trigger("reposition");

      // Select and deselect leaves.
      if (parent.is(".last")) {
        var selected = parent.children("input").is(":checked");
        parent.trigger(selected ? "deselect" : "select");
      }
    }

    // Check a category.
    function selectCategory(e) {
      var checkbox = $(this);

      // Defer executing this script until after the handler has completey
      // fired. There seems to be some inconsistencies between the state
      // of the checkbox between clicking it direclty and calling click()
      // programatically. Pushing the handler execution to the bottom of
      // the stack should make both methods consistent.
      setTimeout(function() {
        checkbox.parent().trigger(checkbox.is(":checked") ? "select" : "deselect");
      }, 10);
    }

    function categoryHighlighted(e) {

      // The problem this is attempting to solve is this event basically
      // needs to be done in the capture phase. A highlighted element's
      // ancestors must be visible first so the positioning can be
      // calculated.
      //
      // I'm using the event data object for something it wasn't intended,
      // but I need a way to bubble data up the hierarchy.

      var item = $(this);
      e.data.unshift(item);

      // Break unless this is the last element in the hierarchy.
      if (!item.parent().is(".root")) { return; }

      while (e.data.length) {
        var item = e.data.shift();

        // Unselect all siblings and their descendants.
        item
          .parent()
            .find(".highlighted")
              .trigger("unhighlight")
              .end()
            .end()

        // Don't highlight leaves.
        if (!item.is(".last")) {
          item

            // Position children in line with the parent.
            .children("ol")
              .css({ top: item.position().top })
              .end()

            // Select the clicked element.
            .addClass("highlighted");
        }
      }
    }

    function categoryUnhighlighted(e) {
      e.stopPropagation();
      $(this).removeClass("highlighted");
    }

    function categorySelected(e) {
      var item = $(this);
      if (e.target == this) {

        // This is the event's target so make sure it's checked.
        item.children("input")[0].checked = true;
        item.addClass("selected");

        // Propagate this event down the tree to select all of
        // this category's descendants.
        var descendants = item.find("li");
        $.each(item.find("> ol li"), function() {
          $(this).trigger("select");
        });
      } else {

        // A descendant was selected.
        item.addClass("descendant_selected");
      }
    }

    function categoryDeselected(e) {
      var item = $(this);
      if (e.target == this) {

        // This is the event's target so make sure it's unchecked.
        item.children("input")[0].checked = false;
        item.removeClass("selected");

        // Propagate this event down the tree to deselect all of
        // this category's descendants.
        var descendants = item.find("li");
        $.each(item.find("> ol li"), function() {
          $(this).trigger("deselect");
        });
      } else {

        // A descendant was unselected so check to see if any
        // other descendants are selected.
        if (!item.find(".selected").length) {
          item.removeClass("descendant_selected");
        }
      }
    }

    function moveBack(e) {
      e.preventDefault();

      var highlighted = categories.find(".highlighted");
      if (highlighted.length) {

        // Unhighlight the deepest element.
        highlighted.eq(highlighted.length - 1)
          .trigger("unhighlight")
          .trigger("reposition");
      }
    }

    function showMatches(e, matches) {
      searchResults.empty();

      if (!matches || !matches.length) {
        searchResults.hide();
        return;
      }

      $.each(matches, function() {
        var
          li = $(this),
          item = searchMatchItem(li);

        searchResults.append(item).show();
      });
    }

    // Create a list item for the given search match.
    function searchMatchItem(match) {
      var link = match.children("a").clone()
        .bind("click", { match: match }, selectSearchResult);

      return $("<li/>").append(link);
    }

    function selectSearchResult(e) {
      e.preventDefault();

      e.data.match
        .trigger("clear")
        .trigger("highlight")
        .trigger("reposition");

      searchResults.hide();
    }

  });

  // Watches the selected input for changes and searches through
  // the given list for matched items. If any are found, the
  // "search" event is triggered and matches are passed along.
  $.fn.extend({
    listSearch: function(list) {
      list = $(list);

      if (list.length) {
        var
          previousSearch,
          items = list.find("li"),
          terms = items.children("a").map(function() {
            return this.innerHTML.toLowerCase();
          });

        this
          .keyup(search)
          .closest("form")
            .submit(function(e) { e.preventDefault(); });
      }

      return this;

      function search() {
        var
          searchField = $(this),
          term = $.trim(searchField.val().toLowerCase()),
          scores = [];

        // Exit quickly if the search term hasn't changed.
        if (previousSearch == term) { return; }
        previousSearch = term;

        // Return null if there is no term.
        if (!term) { searchResults(searchField, null); }

        if (term) {
          terms.each(function(i) {
            var score = this.score(term);
            if (score > 0) {
              scores.push([ score, items[i] ]);
            }
          });

          // Select the top 10 results
          scores = scores.sort(scoreSort).slice(0, 10);

          results = scores.map(function(score) {
            return score[1];
          });

          searchResults(searchField, [ results ]);
        }
      }

      function scoreSort(a, b) {
        return b[0] - a[0];
      }

      function searchResults(searchField, results) {
        searchField.trigger("search", results);
      }
    }
  });

})(jQuery);

(function($) {
  $(function() {

    var
      selectedCategories = $("#selected_categories ul"),
      categories = $("#category_items > ol")

        // Handle category or checkbox clicks.
        .click(categoriesClicked)

        // Listen for some custom events.
        .bind("reposition", reposition)
        .bind("clear", clearHighlighted)
        .bind("highlight", categoryHighlighted)
        .bind("unhighlight", categoryUnhighlighted)
        .bind("select", categorySelected)
        .bind("deselect", categoryDeselected),

      searchField = $("#categories_search input")
        .watermark("Find a category...")
        .bind("search", categorySearch)
        .bind("showResults", showSearchResults)
        .bind("hideResults", hideSearchResults)
        .focus(showSearchResults)

        // Setup search when the search box is first focused.
        .focus(function() {
          $(this)
            .unbind("focus", arguments.callee)
            .listSearch(categories);
        });

      // Move back through the category hierarchy.
      $("#back").click(moveBack);


    /******************
     * Category List
     ******************/

    // Scroll the highlighted element into position.
    function reposition() {
      var
        highlightedLevels = categories.find(".highlighted"),
        leftmostLevel = highlightedLevels.length - 1,
        deepestHighlighted = highlightedLevels.eq(leftmostLevel),

        left = Math.min(leftmostLevel * -315, 0),
        top = categoryTopPosition(deepestHighlighted);

      categories
        .animate({ left: left })
        .parent()
          .animate({ scrollTop: top });
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


    /******************
     * Category Items
     ******************/

    // Handle clicks on the catgories menu to select/deselect categories.
    function categoriesClicked(e) {
      var target = $(e.target);
      if (target.is("a")) {

        // Category was clicked
        e.preventDefault();
        highlightCategory(target);
      } else if (target.is(":checkbox")) {

        // Checkbox was clicked
        selectCategory(target);
      }
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
    function highlightCategory(category) {
      var parent = category.closest("li")
        .trigger("highlight")
        .trigger("reposition");

      // Select and deselect leaves.
      if (parent.is(".last")) {
        var selected = parent.find("> .category_item input").is(":checked");
        parent.trigger(selected ? "deselect" : "select");
      }
    }

    // Check a category.
    function selectCategory(checkbox) {

      // Defer executing this script until after the handler has completey
      // fired. There seems to be some inconsistencies between the state
      // of the checkbox between clicking it direclty and calling click()
      // programatically. Pushing the handler execution to the bottom of
      // the stack should make both methods consistent.
      _.defer(function() {
        checkbox.closest("li").trigger(checkbox.is(":checked") ? "select" : "deselect");
      });
    }

    function categoryHighlighted(e) {

      // Unhighlight all currently highlighted categories.
      categories.trigger("clear");

      // In order to highlight the selected category, all its ancestors must
      // be visible first in order for the positionioning to be calculated.
      // Find all parent LIs in the categories list and sort them so the
      // outermost LI is first and the target for this event is last.
      $(e.target).parents("ol.root li").reverse().andSelf()
        .each(function() {
          var item = $(this);

          // Don't highlight leaves.
          if (!item.is(".last")) {
            item

              // Position children in line with the parent.
              .children("ol")
                .css({ top: item.position().top })
                .end()

              // Highlight the clicked element.
              .addClass("highlighted");
          }
        });
    }

    function categoryUnhighlighted(e) {
      $(e.target).removeClass("highlighted");
    }

    function categorySelected(e, options) {
      options = options || {}

      var
        item = $(e.target),
        selectChildren = (options.selectChildren == null ? true : false);

      // Indicate a descendant was selected on all ancestors.
      item.parents("ol.root li").addClass("descendant_selected");

      // Make sure this category is checked.
      item.find("> .category_item input")[0].checked = true;
      item.addClass("selected");

      // Add this category to the list of selected categories.
      var selectedCategory = $("<li/>")
        .append(
          $("<input type='checkbox' checked='checked' />")

            // Deselect this category when the checkbox is unchecked.
            .click(function() {
              _.defer(function() {
                if (!$(e.target).is(":checked")) {
                  item.trigger("deselect");
                }
              });
            })
        )

        .append(
          item.find("> .category_item a").clone()

            // Show and scroll to this category.
            .click(function(e) {
              e.preventDefault();

              item.trigger("highlight")
              categories.trigger("reposition");
            })
        );

      selectedCategories
        .append(selectedCategory)
        .parent()
          .removeClass("empty");

      // Remove this item from the list of selected categories when the
      // category is deselected.
      item.bind("deselect", function(e) {

        // Only act if this category was deselected and not just a descendant.
        if (e.target == item[0]) {
          selectedCategory.remove();

          // Mark the selected categories container as empty if necessary.
          if (!selectedCategories.children("li").length) {
            selectedCategories.parent().addClass("empty");
          }

          item.unbind("deselect", arguments.callee);
        }
      });

      if (selectChildren) {

        // Propagate this event down the tree to select all of
        // this category's descendants.
        var descendants = item.find("li");
        $.each(item.find("> ol li"), function() {
          $(this).trigger("select");
        });
      }
    }

    function categoryDeselected(e) {
      var item = $(e.target);

      // Make sure this category is unchecked.
      item.find("> .category_item input")[0].checked = false;
      item.removeClass("selected");

      // Propagate this event down the tree to deselect all of
      // this category's descendants.
      var descendants = item.find("li");
      $.each(item.find("> ol li"), function() {
        $(this).trigger("deselect");
      });

      // Check all parent elements and update their descendant
      // selected status.
      item.parents("ol.root li").each(function() {
        var item = $(this);
        if (!item.find(".selected").length) {
          item.removeClass("descendant_selected");
        }
      });
    }


    /******************
     * Search
     ******************/

    var searchResultsList;
    function createSearchResults() {
      searchResultsList = $('<ol id="category_search_results" />')
        .hide()
        .appendTo($("#categories"));
    }

    function categorySearch(e, matches) {
      if (!searchResultsList) {
        createSearchResults();
      }

      searchResultsList.empty();

      if (!matches || !matches.length) {
        $(this).trigger("hideResults");
        return;
      }

      $(matches).each(function() {
        var
          li = $(this),
          item = searchMatchItem(li);

        searchResultsList.append(item);
      });

      $(this).trigger("showResults");
    }

    function showSearchResults() {
      if (searchResultsList && searchResultsList.children("li").length) {
        searchResultsList.show();
      }
    }

    function hideSearchResults() {
      searchResultsList.hide();
    }

    // Create a list item for the given search match.
    function searchMatchItem(match) {
      var link = match.find("> .category_item a").clone()
        .bind("click", { match: match }, selectSearchResult);

      return $("<li/>").append(link);
    }

    function selectSearchResult(e) {
      e.preventDefault();

      e.data.match
        .trigger("clear")
        .trigger("highlight")
        .trigger("select")
        .trigger("reposition");

      searchField.trigger("hideResults");
    }
  });

  $.fn.extend({

    // Let's add reverse().
    reverse: Array.prototype.reverse,

    // Watches the selected input for changes and searches through
    // the given list for matched items. If any are found, the
    // "search" event is triggered and matches are passed along.
    listSearch: function(list) {
      list = $(list);

      var searchField = this
        .focus(search)
        .keypress(function(e) {
          if (e.keyCode == 13) {
            e.preventDefault();
          }
        //})
        //.blur(function() {
          //_.defer(function() {
          //});
        });

      if (list.length) {
        var
          items = list.find("li"),
          keywords = [],
          count = 0,
          total = items.length,
          previousSearch;

        items.each(function(i, item) {

          // Queue adding items to the searched array. If there are a lot of
          // items, this could lock the UI while it's buiding the array.
          _.defer(function() { addKeyword(item); });
        });
      }

      return this;

      function addKeyword(item) {
        var category = $(item).find("> .category_item a");
        keywords.push([
          category.text(),
          category.siblings(".keywords").text()
        ].join(" ").toLowerCase());

        if (++count == total) {
          keywords = _(keywords);

          var searchTimeout;
          searchField
            .keyup(function(e) {
              if (searchTimeout) {
                clearTimeout(searchTimeout);
              }

              searchTimeout = _.delay(function() {
                searchTimeout = null;
                search();
              }, 250);
            })
            .keyup();
        }
      }

      function search() {
        var searchTerm = $.trim(searchField.val().toLowerCase());

        // Exit quickly if the search term hasn't changed.
        if (previousSearch == searchTerm) { return; }
        previousSearch = searchTerm;

        // Return null if there is no search term.
        if (!searchTerm) { searchResults(searchField, null); }

        if (searchTerm) {
          searchResults(searchField,
            keywords.chain()
              .map(function(keyword, i) {
                var score = keywordSearch(keyword, searchTerm);
                if (score > 0) {
                  return { score: score, item: items[i] };
                }
              })
              .compact()
              .sortBy(function(score) {
                return score.score * -1;
              })
              .slice(0, 10)
              .pluck("item")
              .value()
          );
        }
      }

      function keywordSearch(keyword, searchTerm) {
        return _(searchTerm.split(/\s+/)).chain()
          .map(function(word) {
            return keyword.score(word);
          })
          .reduce(0, function(sum, score) {
            return sum + score;
          })
          .value();
      }

      function searchResults(searchField, results) {
        searchField.trigger("search", (results ? [ results ] : results));
      }
    },

    watermark: function(emptyText) {
      this.filter("input[type=text]").each(function() {
        var $this = $(this)
          .focus(function() { removeWatermark($this); })
          .blur(function() { addWatermark($this); });

        // Remove the watermark before the form submits.
        $this.closest("form").submit(function() { removeWatermark($this); });

        addWatermark($this);
      });

      return this;

      function addWatermark(input) {
        if (input.val() == "") {
          input.addClass("empty").val(emptyText);
        }
      }

      function removeWatermark(input) {
        if (input.val() == emptyText) {
          input.removeClass("empty").val("");
        }
      }
    }
  });

})(jQuery);


String.prototype.score = function(search) {
  if (search.length == 0 || this.length == 0) { return 0.0; }

  for (var i = search.length; i > 0; i--) {
    var
      subSearch = search.substring(0, i),
      index = this.search(new RegExp("\\b" + subSearch)),
      score = subSearch.length;

    // Boost the score if it matches at the beginning of a word.
    if (index >= 0) {
      score += 1;
    } else {
      index = this.indexOf(subSearch);
    }

    // No match.
    if (index < 0) { continue; }

    // Remove the matched characters and try to match the unmatched search.
    var
      nextSearch = search.substring(i),
      nextString = this.substring(0, index) +
        this.substring(index + subSearch.length),

      remainingScore = nextString.score(nextSearch);

    // Subtract the score of a non-match.
    if (remainingScore <= 0 && nextSearch.length) {
      remainingScore = Math.pow(2, nextSearch.length) * -1;
    }

    // Reduce the value of non-consecutive multiple matches.
    remainingScore *= 0.9;

    return Math.pow(2, score) + remainingScore;
  }

  return 0.0;
};

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
        .bind("deselect", categoryDeselected);

      // Move back through the category hierarchy.
      $("#back").click(moveBack);

      $("#categories_search input")
        .bind("search", showMatches)
        .focus(showSearchResults);

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


    /******************
     * Category List
     ******************/

    // Scroll the highlighted element into position.
    function reposition() {
      var
        highlightedLevels = categories.find(".highlighted"),
        leftmostLevel = highlightedLevels.length - 1,
        deepestHighlighted = highlightedLevels.eq(leftmostLevel);

      var
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
      setTimeout(function() {
        checkbox.closest("li").trigger(checkbox.is(":checked") ? "select" : "deselect");
      }, 10);
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
              setTimeout(function() {
                if (!$(e.target).is(":checked")) {
                  item.trigger("deselect");
                }
              }, 0);
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

    var searchResults;
    function prepareSearch(input) {
      searchResults = $('<ol id="category_search_results" />')
        .hide()
        .appendTo($("#categories"));

      input.listSearch($("ol.root"));
    }

    function showSearchResults(e) {
      if (!searchResults) {
        prepareSearch($(this));
      } else if (searchResults.children("li").length) {
        searchResults.show();
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

      searchResults.hide();
    }


    // Scriptaculous' highlight() method trips over the category's
    // highlight event. It's not used here anyway so I'm just removing it.
    // IE also chokes when simply testing for the existance of Element. Looking
    // for window.Element fixes that.
    if (window.Element && Element.addMeethods) {
      Element.addMethods({ highlight: function() {} });
    }
  });

  // Let's add reverse(). Prototype hijacks the real reverse mehtod,
  // so check to see if _reverse() exists and use that instead.
  $.fn.reverse = (Array.prototype._reverse || Array.prototype.reverse);

  // Watches the selected input for changes and searches through
  // the given list for matched items. If any are found, the
  // "search" event is triggered and matches are passed along.
  $.fn.extend({
    listSearch: function(list) {
      list = $(list);
      var input = this;

      if (list.length) {
        var
          items = list.find("li"),
          terms = [],
          count = 0,
          total = items.length,
          previousSearch;

        items.map(function() {
          var item = $(this);
          setTimeout(function() { addSearchTerm(item); }, 0);
        });
      }

      return this;

      function addSearchTerm(item) {
        var category = item.find("> .category_item a");
        terms.push([
          category.text(),
          category.siblings(".keywords").text()
        ].join(" ").toLowerCase());

        if (++count == total) {
          terms = $(terms);
          input.keyup(search);
          search();
        }
      }

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

// qs_score - Quicksilver Score
// 
// A port of the Quicksilver string ranking algorithm
// 
// "hello world".score("axl") //=> 0.0
// "hello world".score("ow") //=> 0.6
// "hello world".score("hello world") //=> 1.0
//
// Tested in Firefox 2 and Safari 3
//
// The Quicksilver code is available here
// http://code.google.com/p/blacktree-alchemy/
// http://blacktree-alchemy.googlecode.com/svn/trunk/Crucible/Code/NSString+BLTRRanking.m
//
// The MIT License
// 
// Copyright (c) 2008 Lachie Cox
// 
// Permission is hereby granted, free of charge, to any person obtaining a copy
// of this software and associated documentation files (the "Software"), to deal
// in the Software without restriction, including without limitation the rights
// to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
// copies of the Software, and to permit persons to whom the Software is
// furnished to do so, subject to the following conditions:
// 
// The above copyright notice and this permission notice shall be included in
// all copies or substantial portions of the Software.
// 
// THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
// IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
// FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
// AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
// LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
// OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN
// THE SOFTWARE.


String.prototype.score = function(abbreviation,offset) {
  offset = offset || 0 // TODO: I think this is unused... remove
 
  if(abbreviation.length == 0) return 0.9
  if(abbreviation.length > this.length) return 0.0

  for (var i = abbreviation.length; i > 0; i--) {
    var sub_abbreviation = abbreviation.substring(0,i)
    var index = this.indexOf(sub_abbreviation)


    if(index < 0) continue;
    if(index + abbreviation.length > this.length + offset) continue;

    var next_string       = this.substring(index+sub_abbreviation.length)
    var next_abbreviation = null

    if(i >= abbreviation.length)
      next_abbreviation = ''
    else
      next_abbreviation = abbreviation.substring(i)
 
    var remaining_score   = next_string.score(next_abbreviation,offset+index)
 
    if (remaining_score > 0) {
      var score = this.length-next_string.length;

      if(index != 0) {
        var j = 0;

        var c = this.charCodeAt(index-1)
        if(c==32 || c == 9) {
          for(var j=(index-2); j >= 0; j--) {
            c = this.charCodeAt(j)
            score -= ((c == 32 || c == 9) ? 1 : 0.15)
          }

          // XXX maybe not port this heuristic
          // 
          //          } else if ([[NSCharacterSet uppercaseLetterCharacterSet] characterIsMember:[self characterAtIndex:matchedRange.location]]) {
          //            for (j = matchedRange.location-1; j >= (int) searchRange.location; j--) {
          //              if ([[NSCharacterSet uppercaseLetterCharacterSet] characterIsMember:[self characterAtIndex:j]])
          //                score--;
          //              else
          //                score -= 0.15;
          //            }
        } else {
          score -= index
        }
      }
   
      score += remaining_score * next_string.length
      score /= this.length;
      return score
    }
  }
  return 0.0
}

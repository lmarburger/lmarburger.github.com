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
    var searchResults = $('<ol id="category_search_results" />')
      .hide()
      .appendTo($("#categories"));

    $("#categories_search input")
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
        .trigger("select")
        .trigger("reposition");

      searchResults.hide();
    }

    // Scriptaculous' highlight() method trips over the category's
    // highlight event. It's not used here anyway so I'm just removing it.
    if (Element && Element.addMethods) {
      Element.addMethods({ highlight: function() {} });
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
            var category = $(this);
            return [
              category.text(),
              category.siblings(".keywords").text()
            ].join(' ').toLowerCase();
          });

        this.keyup(search)
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

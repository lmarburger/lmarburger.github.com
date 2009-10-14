(function($) {
  $(function() {
    var categories = $("#categories > ol");

    categories.find("li a").click(function(e) {
      e.preventDefault();

      var
        $link = $(this),
        $parent = $link.parent();

      if ($parent.is(".last")) {

        // Select leaf nodes
        $link.siblings("input").click();
      } else {

        // Highlight this link's parent and reposition
        // the categories list.
        $parent

          // Unselect all siblings and their descendants.
          .parent()
            .find(".highlighted")
              .removeClass("highlighted")
              .end()
            .end()

          // Select the clicked element.
          .addClass("highlighted");

        positionCategories();
      }
    });

    // Add a selected class if the checkbox is checked.
    categories.find("li :checkbox").click(function(e) {
      var
        $this = $(this),
        checked = $this.is(":checked");

      // If this event was fired by calling click(), this handler
      // will be called before the checkbox is actually checked.
      // If it was called by the user actually clicking on the input
      // it will be in the expected state.
      //
      // I'm sure this will need some good old fashioned cross
      // browser testing.
      if (!e.originalTarget) {
        checked = !checked;
      }

      setSelectedClass($this, checked);

      // Check or uncheck descendants.
      var selector = ":checkbox";
      if (checked) {
        selector += ":not(:checked)";
      } else {
        selector += ":checked";
      }

      // Set descendant checkboxs' states without trigger this click
      // handler on each one.
      $this.siblings("ol").find(selector).each(function() {
        this.checked = checked;
        setSelectedClass($(this), checked);
      });

      // Mark the parents as having a selected descendant.
      $this.closest("ol")
        .parents("li").each(function() {
          var checkedDescendants = !!$(this).find(":checkbox:checked").length;
          $(this).toggleClass("descendant_selected", checkedDescendants);
        });

      function setSelectedClass(link, checked) {
        link.parent().toggleClass("selected", checked);
      }
    });

    // Move back through the category hierarchy.
    $("#back").click(function(e){
      e.preventDefault();

      var highlighted = categories.find(".highlighted");
      if (highlighted.length == 0) {
        return;
      }

      var
        leftmostLevel = highlighted.length - 1,
        deepestHighlighted = $(highlighted[leftmostLevel]);

      deepestHighlighted.removeClass("highlighted");

      // If the deepest highlighted element has no children, go
      // back to the grandparent.
      if (deepestHighlighted.is(".last")) {
        $(highlighted[leftmostLevel - 1]).removeClass("highlighted");
      }

      positionCategories();
    });

    function positionCategories() {
      var
        highlightedLevels = categories.find(".highlighted"),
        leftmostLevel = highlightedLevels.length - 1,
        deepestHighlighted = $(highlightedLevels[leftmostLevel]);

      // If the deepest highlighted element has no children, the
      // leftmost node should be its grandparent.
      if (deepestHighlighted.is(".last")) {
        leftmostLevel -= 1;
      }

      var left = Math.min(leftmostLevel * -310, 0);
      categories.animate({ left: left });
    }
  });
})(jQuery);

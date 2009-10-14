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

        console.log($parent.position());
        $parent.children("ol").css({ top: $parent.position().top });

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
      var $this = $(this);

      // Defer executing this script until after the handler has completey
      // fired. There seems to be some inconsistencies between the state
      // of the checkbox between clicking it direclty and calling click()
      // programatically. Pushing the handler execution to the bottom of
      // the stack should make both methods consistent.
      setTimeout(function() {
        var checked = $this.is(":checked");

        setSelectedClass($this, checked);

        // Check or uncheck descendants.
        var selector = ":checkbox";
        if (checked) {
          selector += ":not(:checked)";
        } else {
          selector += ":checked";
        }

        var children = $this.siblings("ol");

        // Set descendant checkboxs' states without triggering this
        // click handler on each one.
        children.find(selector).each(function() {
          this.checked = checked;
          setSelectedClass($(this), checked);
        });

        // Mark the parents as having a selected descendant.
        $this.closest("ol")
          .parents("li").each(function() {
            var checkedDescendants = !!$(this).find(":checkbox:checked").length;
            $(this).toggleClass("descendant_selected", checkedDescendants);
          });

      }, 10);

      function setSelectedClass(link, checked) {
        var parent = link.parent().toggleClass("selected", checked);

        // Also remove the descendant selected class.
        if (!checked) {
          parent.removeClass("descendant_selected");
        }
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

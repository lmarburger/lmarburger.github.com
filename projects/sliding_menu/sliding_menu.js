(function($) {
  $(function() {
    var categories = $("#categories > ol");

    categories.find("li a").click(function(e) {
      e.preventDefault();

      var selected = $(this).parent()

        // Unselect all siblings and their descendents.
        .parent()
          .find(".selected")
            .removeClass("selected")
            .end()
          .end()

        // Select the clicked element.
        .addClass("selected");

      positionCategories();
    });

    $("#back").click(function(e){
      e.preventDefault();

      var selected = categories.find(".selected");
      if (selected.length == 0) {
        return;
      }

      var
        leftmostLevel = selected.length - 1,
        deepestSelected = $(selected[leftmostLevel]);

      deepestSelected.removeClass("selected");

      // If the deepest selected element has no children, go
      // back to the grandparent.
      if (deepestSelected.is(".last")) {
        $(selected[leftmostLevel - 1]).removeClass("selected");
      }

      positionCategories();
    });

    function positionCategories() {
      var
        selectedLevels = categories.find(".selected"),
        leftmostLevel = selectedLevels.length - 1,
        deepestSelected = $(selectedLevels[leftmostLevel]);

      // If the deepest selected element has no children, the
      // leftmost node should be its grandparent.
      if (deepestSelected.is(".last")) {
        leftmostLevel -= 1;
      }

      var left = Math.min(leftmostLevel * -310, 0);
      categories.animate({ left: left });
    }
  });
})(jQuery);

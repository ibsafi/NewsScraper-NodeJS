$(function () {

  $(document).on("click", ".cmd", function () {
    // Grab the id associated with the article from the submit button
    var cmdtype = $(this).data("cmd");
    var query = {};
    switch (cmdtype) {
      case "remove":
        var article_id = $(this).closest(".card").data("id")
        var comment_id = $(this).closest(".form-row").data("id");
        query.type = "DELETE";
        query.data = { note_id: comment_id };
        query.route = "/article/" + article_id;
        break;
      case "add":
        var article_id = $(this).closest(".card").data("id")
        query.type = "POST";
        query.data = { body: $('[data-id="' + article_id + '"] input').val().trim() };
        query.route = "/article/" + article_id;
        break;
    }
    // Run a POST query to change the note, using what's entered in the inputs
    $.ajax({
      method: query.type,
      url: query.route,
      data: query.data
    })
      // With that done
      .then(function (data) {
        location.reload();
      }).catch(function (err) {
        console.log(err);
      });
  });

});

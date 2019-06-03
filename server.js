var express = require("express");
var mongoose = require("mongoose");

// Our scraping tools
// Axios is a promised-based http library, similar to jQuery's Ajax method
// It works on the client and on the server
var axios = require("axios");
var cheerio = require("cheerio");

// Require all models
var db = require("./models");

var PORT = process.env.PORT || 3000;

// Initialize Express
var app = express();

// Configure middleware
// Parse request body as JSON
app.use(express.urlencoded({ extended: true }));
app.use(express.json());
// Make public a static folder
app.use(express.static("public"));

// Set Handlebars.
var exphbs = require("express-handlebars");
app.engine("handlebars", exphbs({ defaultLayout: "main" }));
app.set("view engine", "handlebars");

// Connect to the Mongo DB
var MONGODB_URI = process.env.MONGODB_URI || "mongodb://localhost/newsscraper";

mongoose.connect(MONGODB_URI, { useNewUrlParser: true });
// mongoose.connect("mongodb://localhost/newsscraper",);

// Routes
// Route for main page
app.get("/", function (req, res) {

  scraper(function () {
    db.Article.find({})
      // Specify that we want to populate the retrieved libraries with any associated books
      .populate("notes")
      .then(function (dbArticle) {
        // If any Libraries are found, send them to the client with any associated Books
        console.log(dbArticle)
        res.render("index", { articles: dbArticle });
      })
      .catch(function (err) {
        // If an error occurs, send it back to the client
        res.json(err);
      });
  });

});

function scraper(cb) {
  axios.get("https://www.aljazeera.com/topics/regions/us-canada.html").then(function (response) {
    // Then, we load that into cheerio and save it to $ for a shorthand selector
    var $ = cheerio.load(response.data);

    $('div[class="col-md-6 middle-east-bot"] div.row .col-md-6 div.frame-container').each(function (i, element) {
      // Save an empty result object
      var result = {};

      // Add the text and href of every link, and save them as properties of the result object
      result.title = $(element)
        .children("a").children("img")
        .attr("title");
      result.imglink = "https://www.aljazeera.com" + $(element)
        .children("a").children("img")
        .attr("src");
      result.link = "https://www.aljazeera.com" + $(element)
        .children("a")
        .attr("href");

      axios.get(result.link).then(function (articleResponse) {
        let $ = cheerio.load(articleResponse.data);
        result.desc = $(".article-heading-des").text();

        // Create a new Article using the `result` object built from scraping
        db.Article.create(result)
          .then(function (dbArticle) {
            console.log("dbArticle: \n", JSON.stringify(dbArticle, null, 5));
          })
          .catch(function (err) {
            // If an error occurred, log it
            console.log(err);
          });

      });

    });

  })
    .then(function () {
      cb();
    }).catch(function (err) {
      console.log(err)
    });

}
// Route for adding a comment into database and associates it with the article
app.post("/article/:id", function (req, res) {
  db.Note.create({ body: req.body.body })
    .then(function (dbNote) {
      return db.Article.findOneAndUpdate({ _id: req.params.id }, { $push: { notes: dbNote._id } }, { new: true });
    })
    .then(function (dbArticle) {
      // If the Article was updated successfully, send it back to the client
      res.json(dbArticle);
    })
    .catch(function (err) {
      // If an error occurs, send it back to the client
      res.json(err);
    });
});



// Route for deleting an Article's associated Note
app.delete("/article/:id", function (req, res) {
  db.Note.remove(req.body.noteid)
    .then(function (dbNote) {
      return db.Article.update({ _id: req.params.id }, { $pull: { notes: req.body.noteid } }, { new: true });
    })
    .then(function (dbArticle) {
      // If the Library was updated successfully, send it back to the client
      res.json(dbArticle);
    })
    .catch(function (err) {
      // If an error occurs, send it back to the client
      res.json(err);
    })
});

// Start the server
app.listen(PORT, function () {
  console.log("App running on port " + PORT + "!");
});
scraper(function () { });

var mongoose = require("mongoose");

// Save a reference to the Schema constructor
var Schema = mongoose.Schema;

// Using the Schema constructor, create a new NoteSchema object
// This is similar to a Sequelize model
var NoteSchema = new Schema({
  // `body` is of type String
  body: {
    type: String,
    trim: true,
    required: "Note is Required",
    validate: [
      function (input) {
        return input.length >= 1;
      },
      "Note should be longer."
    ]
  }
});

// This creates our model from the above schema, using mongoose's model method
var Note = mongoose.model("Note", NoteSchema);

// Export the Note model
module.exports = Note;

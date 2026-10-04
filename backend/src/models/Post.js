const mongoose = require('mongoose');

const postSchema = new mongoose.Schema(
  {
    author: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    title: { type: String, required: true, trim: true, maxlength: 200 },
    body: { type: String, required: true, maxlength: 20000 },
  },
  { timestamps: true, toJSON: { versionKey: false } }
);

// User posts $lookup / ?author= list / cascade delete: Post.find({ author, _id: { $lt: after } }).sort({ _id: -1 })
postSchema.index({ author: 1, _id: -1 });

module.exports = mongoose.model('Post', postSchema);

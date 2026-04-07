import { Schema, model } from 'mongoose';

const forumProfileSchema = new Schema({
  userId: {
    type: Schema.Types.ObjectId,
    ref: 'User',
    required: true,
    unique: true,
    index: true
  },
  alias: {
    type: String,
    required: true,
    trim: true,
    maxlength: 24
  }
}, {
  timestamps: true
});

export default model('ForumProfile', forumProfileSchema);

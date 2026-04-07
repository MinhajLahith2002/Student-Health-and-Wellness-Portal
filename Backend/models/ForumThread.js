import { Schema, model } from 'mongoose';

const forumReplySchema = new Schema({
  userId: {
    type: Schema.Types.ObjectId,
    ref: 'User',
    default: null
  },
  authorAlias: {
    type: String,
    required: true,
    trim: true,
    maxlength: 24
  },
  body: {
    type: String,
    required: true,
    trim: true,
    maxlength: 1500
  }
}, {
  timestamps: true
});

const forumThreadSchema = new Schema({
  userId: {
    type: Schema.Types.ObjectId,
    ref: 'User',
    default: null,
    index: true
  },
  authorAlias: {
    type: String,
    required: true,
    trim: true,
    maxlength: 24
  },
  title: {
    type: String,
    required: true,
    trim: true,
    minlength: 3,
    maxlength: 160
  },
  body: {
    type: String,
    required: true,
    trim: true,
    minlength: 10,
    maxlength: 3000
  },
  supportType: {
    type: String,
    enum: ['General Support', 'Anxiety', 'Burnout', 'Sleep', 'Motivation'],
    default: 'General Support'
  },
  replies: [forumReplySchema],
  reportCount: {
    type: Number,
    default: 0
  },
  isSeeded: {
    type: Boolean,
    default: false
  },
  lastActivityAt: {
    type: Date,
    default: Date.now
  }
}, {
  timestamps: true
});

forumThreadSchema.index({ createdAt: -1 });
forumThreadSchema.index({ lastActivityAt: -1 });

export default model('ForumThread', forumThreadSchema);

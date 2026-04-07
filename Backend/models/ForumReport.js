import { Schema, model } from 'mongoose';

const forumReportSchema = new Schema({
  reportedBy: {
    type: Schema.Types.ObjectId,
    ref: 'User',
    required: true,
    index: true
  },
  targetType: {
    type: String,
    enum: ['thread', 'reply'],
    required: true
  },
  targetId: {
    type: String,
    required: true,
    trim: true
  },
  parentThreadId: {
    type: Schema.Types.ObjectId,
    ref: 'ForumThread',
    required: true,
    index: true
  },
  reason: {
    type: String,
    trim: true,
    maxlength: 400,
    default: 'Student requested moderator review'
  }
}, {
  timestamps: true
});

forumReportSchema.index({ reportedBy: 1, targetType: 1, targetId: 1 }, { unique: true });

export default model('ForumReport', forumReportSchema);

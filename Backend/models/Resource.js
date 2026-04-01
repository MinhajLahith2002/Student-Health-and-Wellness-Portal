import { Schema, model } from 'mongoose';

const resourceSchema = new Schema({
  title: {
    type: String,
    required: true,
    trim: true
  },
  description: {
    type: String,
    required: true
  },
  type: {
    type: String,
    enum: ['Article', 'Video', 'Infographic', 'Podcast', 'Guide'],
    required: true
  },
  category: {
    type: String,
    enum: ['Mental Health', 'Nutrition', 'General Health', 'Safety', 'Fitness', 'Wellness'],
    required: true
  },
  subCategory: {
    type: String,
    trim: true,
    maxlength: 80
  },
  content: {
    type: String,
    required: true
  },
  coverImage: {
    type: String
  },
  coverImagePublicId: {
    type: String
  },
  videoUrl: {
    type: String
  },
  duration: {
    type: String
  },
  author: {
    type: String,
    required: true
  },
  readTime: {
    type: String
  },
  tags: [{
    type: String
  }],
  status: {
    type: String,
    enum: ['Draft', 'Published', 'Archived'],
    default: 'Draft'
  },
  views: {
    type: Number,
    default: 0
  },
  likes: {
    type: Number,
    default: 0
  },
  publishedAt: Date,
  createdBy: {
    type: Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  createdAt: {
    type: Date,
    default: Date.now
  },
  updatedAt: {
    type: Date,
    default: Date.now
  }
}, {
  timestamps: true
});

resourceSchema.index({ title: 'text', description: 'text', tags: 'text' });
resourceSchema.index({ category: 1, status: 1 });
resourceSchema.index({ type: 1 });

export default model('Resource', resourceSchema);

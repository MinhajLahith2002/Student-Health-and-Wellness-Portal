import { Schema, model } from 'mongoose';

const moodLogSchema = new Schema({
  userId: {
    type: Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  mood: {
    type: String,
    enum: ['Great', 'Okay', 'Down', 'Stressed', 'Tired', 'Anxious', 'Happy', 'Sad', 'Energetic'],
    required: true
  },
  
  moodScore: {
    type: Number,
    min: 1,
    max: 10
  },
  notes: {
    type: String,
    maxlength: 500
  },
  factors: [{
    type: String,
    enum: ['Sleep', 'Exercise', 'Diet', 'Social', 'Work', 'Exams', 'Relationships', 'Health']
  }],
  date: {
    type: Date,
    default: Date.now
  },
  createdAt: {
    type: Date,
    default: Date.now
  }
});

moodLogSchema.index({ userId: 1, date: -1 });

export default model('MoodLog', moodLogSchema);
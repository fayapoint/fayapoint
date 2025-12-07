import mongoose from 'mongoose';

const ImageCreationSchema = new mongoose.Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
  },
  userName: {
    type: String,
    required: true,
  },
  prompt: {
    type: String,
    required: true,
  },
  imageUrl: {
    type: String,
    required: true,
  },
  publicId: {
    type: String, // Cloudinary Public ID
    required: false
  },
  provider: {
    type: String,
    default: 'flux-1-schnell',
  },
  // POD & Gallery features
  isPublic: {
    type: Boolean,
    default: false, // If true, shows in public gallery
  },
  category: {
    type: String,
    enum: ['general', 'apparel', 'art', 'logo', 'pattern', 'illustration', 'photo'],
    default: 'general',
  },
  tags: [{
    type: String,
  }],
  likes: {
    type: Number,
    default: 0,
  },
  usedInProducts: {
    type: Number,
    default: 0,
  },
  createdAt: {
    type: Date,
    default: Date.now,
  },
});

// Indexes for performance
ImageCreationSchema.index({ userId: 1, createdAt: -1 });
ImageCreationSchema.index({ isPublic: 1, createdAt: -1 });
ImageCreationSchema.index({ isPublic: 1, likes: -1 });

export default mongoose.models.ImageCreation || mongoose.model('ImageCreation', ImageCreationSchema);

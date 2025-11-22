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
  createdAt: {
    type: Date,
    default: Date.now,
  },
});

export default mongoose.models.ImageCreation || mongoose.model('ImageCreation', ImageCreationSchema);

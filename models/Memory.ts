import mongoose, { Schema, model, models } from "mongoose";

export interface ILocation {
  latitude: number;
  longitude: number;
  address?: string;
  city?: string;
  country?: string;
}

export interface IMemory {
  userId: mongoose.Types.ObjectId;
  title: string;
  description?: string;
  content?: string;
  type: 'text' | 'image' | 'video' | 'mixed';
  images?: string[]; // ImageKit URLs
  videos?: string[]; // ImageKit URLs
  location?: ILocation;
  tags?: string[];
  isPublic: boolean;
  createdAt?: Date;
  updatedAt?: Date;
}

const locationSchema = new Schema<ILocation>({
  latitude: { type: Number, required: true },
  longitude: { type: Number, required: true },
  address: { type: String },
  city: { type: String },
  country: { type: String },
});

const memorySchema = new Schema<IMemory>(
  {
    userId: { type: Schema.Types.ObjectId, ref: 'User', required: true },
    title: { type: String, required: true },
    description: { type: String },
    content: { type: String },
    type: { 
      type: String, 
      enum: ['text', 'image', 'video', 'mixed'], 
      required: true 
    },
    images: [{ type: String }],
    videos: [{ type: String }],
    location: locationSchema,
    tags: [{ type: String }],
    isPublic: { type: Boolean, default: false },
  },
  {
    timestamps: true,
  }
);

const Memory = models?.Memory || model<IMemory>("Memory", memorySchema);
export default Memory;
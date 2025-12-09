import mongoose, { Schema, Document, model, Model } from "mongoose";

export interface IBlog extends Document {
    title: string;
    thumbnail: string;
    description: string;
    category: {
        name: string;
        _id: mongoose.Types.ObjectId;
    };
    createdAt?: Date;
    updatedAt?: Date;
}

const BlogSchema = new Schema<IBlog>(
    {
        title: { type: String, required: true, unique: true, trim: true },
        thumbnail: { type: String, required: true },
        description: { type: String, required: true },
        category: {
            _id: { type: mongoose.Schema.Types.ObjectId, required: true },
            name: { type: String, required: true },
        },
    },
    { timestamps: true }
);

const Blog: Model<IBlog> = model<IBlog>("Blog", BlogSchema);

export default Blog;

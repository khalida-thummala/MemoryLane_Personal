import mongoose from 'mongoose';

const replySchema = new mongoose.Schema({
    parentComment: { type: mongoose.Schema.Types.ObjectId, ref: 'Comment', required: true },
    repliedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    replyText: { type: String, required: true },
    isOwnerReply: { type: Boolean, default: false },
    created_at: { type: Date, default: Date.now }
});

const commentSchema = new mongoose.Schema({
    memory: { type: mongoose.Schema.Types.ObjectId, ref: 'Memory', required: true },
    user: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    text: { type: String, required: true },
    replies: [replySchema],
    created_at: { type: Date, default: Date.now },
    updated_at: { type: Date, default: Date.now }
}, { timestamps: { createdAt: 'created_at', updatedAt: 'updated_at' } });

const Comment = mongoose.model('Comment', commentSchema);
export default Comment;

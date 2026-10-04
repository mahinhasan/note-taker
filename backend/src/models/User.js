const mongoose = require('mongoose');

const ROLES = Object.freeze(['user', 'admin']);

const userSchema = new mongoose.Schema(
  {
    name: { type: String, required: true, trim: true, maxlength: 100 },
    email: { type: String, required: true, trim: true, lowercase: true, maxlength: 254 },
    passwordHash: { type: String, required: true, select: false },
    role: { type: String, enum: ROLES, default: 'user' },
    interests: {
      type: [{ type: String, trim: true, lowercase: true, maxlength: 50 }],
      default: [],
    },
  },
  {
    timestamps: true,
    toJSON: {
      versionKey: false,
      transform(doc, ret) {
        delete ret.passwordHash;
        return ret;
      },
    },
  }
);

// Login, register duplicate check, email updates: User.findOne({ email })
userSchema.index({ email: 1 }, { unique: true });
// Grouped-by-interests aggregation: $match { interests: ... } as the first stage
userSchema.index({ interests: 1 });

const User = mongoose.model('User', userSchema);

module.exports = User;
module.exports.ROLES = ROLES;

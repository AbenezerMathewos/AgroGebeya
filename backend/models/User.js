const mongoose = require('mongoose');

const userSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: [true, 'Name is required'],
      trim: true,
    },
    email: {
      type: String,
      required: [true, 'Email is required'],
      unique: true,
      lowercase: true,
      trim: true,
      match: [/^\S+@\S+\.\S+$/, 'Please provide a valid email'],
    },
    password: {
      type: String,
      required: [true, 'Password is required'],
      minlength: 6,
      select: false, // never return password by default
    },
    phone: {
      type: String,
      trim: true,
      default: '',
    },
    role: {
      type: String,
      enum: ['farmer', 'buyer', 'admin', 'transporter', 'cooperative'],
      default: 'buyer',
    },
    region: {
      type: String,
      trim: true,
      default: 'Addis Ababa',
    },
    zone: {
      type: String,
      trim: true,
      default: 'Central',
    },
    woreda: {
      type: String,
      trim: true,
      default: '',
    },
    cooperativeName: {
      type: String,
      trim: true,
      default: '',
    },
    preferredLanguage: {
      type: String,
      enum: ['en', 'am', 'om', 'ti', 'wot'],
      default: 'en',
    },
  },
  { timestamps: true }
);

module.exports = mongoose.model('User', userSchema);


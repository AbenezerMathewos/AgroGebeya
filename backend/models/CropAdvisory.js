const mongoose = require('mongoose');

const cropAdvisorySchema = new mongoose.Schema(
  {
    cropName: {
      type: String,
      required: true,
      trim: true,
    },
    localNames: {
      am: String,
      om: String,
      wot: String,
      ti: String,
    },
    pestOrDisease: {
      type: String,
      required: true,
      trim: true,
    },
    scientificName: {
      type: String,
      trim: true,
      default: '',
    },
    severity: {
      type: String,
      enum: ['High', 'Moderate', 'Low', 'Critical'],
      default: 'Moderate',
    },
    symptoms: {
      en: String,
      am: String,
      om: String,
      wot: String,
    },
    prevention: {
      en: String,
      am: String,
      om: String,
      wot: String,
    },
    organicTreatment: {
      en: String,
      am: String,
      om: String,
      wot: String,
    },
    chemicalTreatment: {
      en: String,
      am: String,
      om: String,
      wot: String,
    },
    favorableSeason: {
      type: String,
      trim: true,
      default: 'Belg / Meher rainy season',
    },
    imageUrl: {
      type: String,
      default: '',
    },
  },
  { timestamps: true }
);

cropAdvisorySchema.index({ cropName: 'text', pestOrDisease: 'text' });

module.exports = mongoose.model('CropAdvisory', cropAdvisorySchema);

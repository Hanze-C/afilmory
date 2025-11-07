
import { z } from 'zod'

// ToneType schema
export const toneTypeSchema = z.enum(['low-key', 'high-key', 'normal', 'high-contrast'])

// ToneAnalysis schema
export const toneAnalysisSchema = z.object({
  toneType: toneTypeSchema,
  brightness: z.number().min(0).max(100),
  contrast: z.number().min(0).max(100),
  shadowRatio: z.number().min(0).max(1),
  highlightRatio: z.number().min(0).max(1),
})

// FujiRecipe schema
export const fujiRecipeSchema = z.object({
  FilmMode: z.enum([
    'F0/Standard (Provia)',
    'F1/Studio Portrait',
    'F1a/Studio Portrait Enhanced Saturation',
    'F1b/Studio Portrait Smooth Skin Tone (Astia)',
    'F1c/Studio Portrait Increased Sharpness',
    'F2/Fujichrome (Velvia)',
    'F3/Studio Portrait Ex',
    'F4/Velvia',
    'Pro Neg. Std',
    'Pro Neg. Hi',
    'Classic Chrome',
    'Eterna',
    'Classic Negative',
    'Bleach Bypass',
    'Nostalgic Neg',
    'Reala ACE',
  ]),
  GrainEffectRoughness: z.enum(['Off', 'Weak', 'Strong']),
  GrainEffectSize: z.enum(['Off', 'Small', 'Large']),
  ColorChromeEffect: z.enum(['Off', 'Weak', 'Strong']),
  ColorChromeFxBlue: z.enum(['Off', 'Weak', 'Strong']),
  WhiteBalance: z.enum([
    'Auto',
    'Auto (white priority)',
    'Auto (ambiance priority)',
    'Daylight',
    'Cloudy',
    'Daylight Fluorescent',
    'Day White Fluorescent',
    'White Fluorescent',
    'Warm White Fluorescent',
    'Living Room Warm White Fluorescent',
    'Incandescent',
    'Flash',
    'Underwater',
    'Custom',
    'Custom2',
    'Custom3',
    'Custom4',
    'Custom5',
    'Kelvin',
  ]),
  WhiteBalanceFineTune: z.string(),
  DynamicRange: z.enum(['Standard', 'Wide']),
  HighlightTone: z.string(),
  ShadowTone: z.string(),
  Saturation: z.string(),
  Sharpness: z.string(),
  NoiseReduction: z.string(),
  Clarity: z.number(),
  ColorTemperature: z.any(), // Using any for Tags['ColorTemperature']
  DevelopmentDynamicRange: z.number(),
  DynamicRangeSetting: z.any(), // Using any for Tags['DynamicRangeSetting']
})

// SonyRecipe schema
export const sonyRecipeSchema = z.object({
  CreativeStyle: z.string(),
  PictureEffect: z.string(),
  Hdr: z.string(),
  SoftSkinEffect: z.string(),
})

// PickedExif schema
export const pickedExifSchema = z.object({
  // Time zone and time related
  zone: z.string(),
  tz: z.string(),
  tzSource: z.string(),

  // Basic camera information
  Orientation: z.number(),
  Make: z.string(),
  Model: z.string(),
  Software: z.string(),
  Artist: z.string(),
  Copyright: z.string(),

  // Exposure related
  ExposureTime: z.union([z.string(), z.number()]),
  FNumber: z.number(),
  ExposureProgram: z.string(),
  ISO: z.number(),
  ShutterSpeedValue: z.union([z.string(), z.number()]),
  ApertureValue: z.number(),
  BrightnessValue: z.number(),
  ExposureCompensation: z.number(),
  MaxApertureValue: z.number(),

  // Time offset
  OffsetTime: z.string(),
  OffsetTimeOriginal: z.string(),
  OffsetTimeDigitized: z.string(),

  // Light source and flash
  LightSource: z.string(),
  Flash: z.string(),

  // Focal length related
  FocalLength: z.string(),
  FocalLengthIn35mmFormat: z.string(),

  // Lens related
  LensMake: z.string(),
  LensModel: z.string(),

  // Color and shooting mode
  ColorSpace: z.string(),
  ExposureMode: z.string(),
  SceneCaptureType: z.string(),

  // Calculated fields
  Aperture: z.number(),
  ScaleFactor35efl: z.number(),
  ShutterSpeed: z.union([z.string(), z.number()]),
  LightValue: z.number(),

  // Date time (ISO format after processing)
  DateTimeOriginal: z.string(),
  DateTimeDigitized: z.string(),

  // Image dimensions
  ImageWidth: z.number(),
  ImageHeight: z.number(),

  MeteringMode: z.any(),
  WhiteBalance: z.any(),
  WBShiftAB: z.any(),
  WBShiftGM: z.any(),
  WhiteBalanceBias: z.any(),
  FlashMeteringMode: z.any(),
  SensingMethod: z.any(),
  FocalPlaneXResolution: z.any(),
  FocalPlaneYResolution: z.any(),
  GPSAltitude: z.any(),
  GPSLatitude: z.any(),
  GPSLongitude: z.any(),
  GPSAltitudeRef: z.any(),
  GPSLatitudeRef: z.any(),
  GPSLongitudeRef: z.any(),

  // Fuji film recipe
  FujiRecipe: fujiRecipeSchema,

  // HDR related
  MPImageType: z.any(),

  // Rating
  Rating: z.number(),
})

// PhotoInfo schema
export const photoInfoSchema = z.object({
  title: z.string(),
  dateTaken: z.string(),
  tags: z.array(z.string()),
  description: z.string(),
})

// PhotoManifestItem schema
export const photoManifestItemSchema = photoInfoSchema.extend({
  //   id: z.string(),
  title: z.string(),
  //   originalUrl: z.string(),
  //   thumbnailUrl: z.string(),
  //   thumbHash: z.string().nullable(),
  width: z.number(),
  height: z.number(),
  aspectRatio: z.number(),
  //   s3Key: z.string(),
  lastModified: z.string(),
  size: z.number(),
  exif: pickedExifSchema, //.nullable(),
  toneAnalysis: toneAnalysisSchema, // .nullable(),
  isLivePhoto: z.boolean().optional(),
  isHDR: z.boolean().optional(),
  //   livePhotoVideoUrl: z.string().optional(),
  //   livePhotoVideoS3Key: z.string().optional(),
})

export type PhotoManifestItemZod = z.infer<typeof photoManifestItemSchema>

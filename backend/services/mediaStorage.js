const { v2: cloudinary } = require('cloudinary');

function requireConfiguration() {
  if (!process.env.CLOUDINARY_URL) {
    const error = new Error('Persistent media storage is not configured.');
    error.statusCode = 503;
    throw error;
  }
}

function uploadBuffer(file, folder) {
  requireConfiguration();
  const resourceType = file.mimetype?.startsWith('image/') ? 'image' : 'raw';

  return new Promise((resolve, reject) => {
    const stream = cloudinary.uploader.upload_stream(
      { folder, resource_type: resourceType, use_filename: false, unique_filename: true },
      (error, result) => {
        if (error) return reject(error);
        resolve(result.secure_url);
      }
    );
    stream.end(file.buffer);
  });
}

function parseAsset(assetUrl) {
  if (!assetUrl || !assetUrl.includes('res.cloudinary.com')) return null;
  try {
    const { pathname } = new URL(assetUrl);
    const match = pathname.match(/\/(image|raw)\/upload\/(?:v\d+\/)?(.+)\.[^/.]+$/);
    return match ? { resourceType: match[1], publicId: match[2] } : null;
  } catch {
    return null;
  }
}

async function deleteMedia(assetUrl) {
  const asset = parseAsset(assetUrl);
  if (!asset || !process.env.CLOUDINARY_URL) return;
  await cloudinary.uploader.destroy(asset.publicId, {
    resource_type: asset.resourceType,
    invalidate: true,
  });
}

function mediaUrl(value, legacyFolder) {
  return /^https?:\/\//i.test(value || '') ? value : `/uploads/${legacyFolder}/${value}`;
}

module.exports = { uploadBuffer, deleteMedia, mediaUrl };

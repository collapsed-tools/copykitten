import fs from 'fs';
import fsp from 'fs/promises';

export async function copyBigFile(sourceFilePath, targetFilePath, progressCallback) {
  const highWatermark = 1024 * 1024 * 32; // 32MB chunk
  const readStream = fs.createReadStream(sourceFilePath, { highWatermark });
  const writeStream = fs.createWriteStream(targetFilePath, { highWatermark });

  const stat = await fsp.stat(sourceFilePath);
  const totalSize = stat.size;
  let copiedSize = 0;

  readStream.on('data', (chunk) => {
    const chunkSize = chunk.length;
    copiedSize += chunkSize;
    progressCallback(chunkSize, copiedSize, totalSize);
  });

  await new Promise((resolve, reject) => {
    writeStream.on('finish', resolve);
    writeStream.on('error', reject);
    readStream.pipe(writeStream);
  });
  // Copy over the file metadata
  await fsp.utimes(targetFilePath, stat.atime, stat.mtime);

  // Copy over the file permissions
  await fsp.chmod(targetFilePath, stat.mode);
}
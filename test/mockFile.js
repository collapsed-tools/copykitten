import fsp from 'fs/promises';
import path from 'path';

export class MockFile {
  constructor(relativePath, content, mtime) {
    this.relativePath = path.normalize(relativePath);
    this.content = content;
    this.mtime = new Date(mtime);
  }
}

export async function writeMockFiles(mockFiles, folderPath) {
  const relativePathes = mockFiles.map(mockFile => mockFile.relativePath);
  const uniqueRelativePathes = Object.keys(Object.fromEntries(relativePathes.map((relativePath => [relativePath, relativePath]))));
  if (uniqueRelativePathes.length != relativePathes.length) {
    throw new Error('pathes are not unique');
  }
  for (const mockFile of mockFiles) {
    const filePath = path.join(folderPath, mockFile.relativePath);
    await fsp.mkdir(path.dirname(filePath), { recursive: true });
    await fsp.writeFile(filePath, mockFile.content, 'utf8');
    await fsp.utimes(filePath, new Date(), mockFile.mtime);
  }
}

export async function readMockFiles(folderPath, baseFolderPath = null) {
  baseFolderPath = baseFolderPath || folderPath;
  let files = [];
  const entries = await fsp.readdir(folderPath, { withFileTypes: true });
  for (const entry of entries) {
    const entryPath = path.join(folderPath, entry.name);
    if (entry.isDirectory()) {
      const innerFiles = await readMockFiles(entryPath, baseFolderPath); // recursive
      files = files.concat(innerFiles);
    } else {
      const content = await fsp.readFile(entryPath, 'utf8');
      const stat = await fsp.stat(entryPath);
      const mtime = stat.mtime;
      const relativePath = path.relative(baseFolderPath, entryPath);
      const file = new MockFile(relativePath, content, mtime);
      files.push(file);
    }
  }
  return files;
}

export async function writeAndReadMockFiles(testFolderPath, mockFiles) {
  fsp.mkdir(testFolderPath, {recursive: true});
  let readedMockFiles;
  try {
    await writeMockFiles(mockFiles, testFolderPath);
    readedMockFiles = await readMockFiles(testFolderPath);  
  } finally {
    await fsp.rm(testFolderPath, {recursive: true, force: true});
  }
  return readedMockFiles;
}

import fsp from 'fs/promises';
import path from 'path';
import { printPriorStats, printProgressStats, printFinalStats } from './print.js'
import EventEmitter from 'events';

class FileMetadata {
  constructor(mtime, size) {
    this.mtime = new Date(mtime);
    this.size = size;
  }
}

class File {
  constructor(originalRelativePath, metadata, newRelativePath = null) {
    this.originalRelativePath = originalRelativePath;
    this.metadata = metadata;
    this.newRelativePath = newRelativePath || originalRelativePath;
  }
}

export class TransferStrategyEnum {
  static MOVE = 'move';
  static COPY = 'copy';
}

export class ConflictResoleStrategyEnum {
  static FAIL = 'fail'; // Fail-fast mode, that throw just throw an error
  static KEEPBOTH = 'keepboth'; // Keep origial file, while adding '.new' before extention to newly moved/copied file  
  static SKIP = 'skip'; // Keep origial file, skip moving/copying (default option for copy strategy) 
  static OVERWRITE = 'overwrite'; // Overwrite safely (copy/move with adding '.tmp' before extention, then after success, delete original, and finally rename new file to original name, removing '.tmp' before extention)
}

export class TransferProgressStat {
  current = {
    fileNumber: 0,
    byte: 0,
  }
  total = {
    fileNumber: 0,
    byte: 0,
  }
  ee = new EventEmitter();
  reset(totalFileNumber, totalByte) {
    this.total.fileNumber = totalFileNumber;
    this.total.byte = totalByte;
    this.current.fileNumber = 0;
    this.current.byte = 0;
    this.current.fileName = null;
    this.ee.emit('reset');
  }

  update(fileName, bytes) {
    this.current.fileNumber++;
    this.current.byte += bytes;
    this.current.fileName = fileName;
    this.ee.emit('update');
  }
  end() {
    this.current.fileName = null;
    this.ee.emit('end');
  }
}

export class Transferer {
  static shared = new Transferer();
  progressStat = new TransferProgressStat();

  async getFiles(folderPath, baseFolderPath = null) {
    baseFolderPath = baseFolderPath || folderPath;
    var files = [];

    const dirEntries = await fsp.readdir(folderPath, { withFileTypes: true });
    for (const entry of dirEntries) {
      const entryPath = path.join(folderPath, entry.name);
      if (entry.isFile()) {
        const fileStat = await fsp.stat(entryPath);
        const relativePath = path.relative(baseFolderPath, entryPath);
        const fileMetadata = new FileMetadata(fileStat.mtime, fileStat.size);
        const file = new File(relativePath, fileMetadata);
        files.push(file);
      } else if (entry.isDirectory()) {
        const subFolderFiles = await this.getFiles(entryPath, baseFolderPath);
        files = files.concat(subFolderFiles);
      }
    }
    return files;
  }

  async transferFile(file, cardFolderPath, storageFolderPath, strategy) {
    const originalfilePath = path.join(cardFolderPath, file.originalRelativePath);
    const newFilePath = path.join(storageFolderPath, file.newRelativePath);

    const { dir, name, ext } = path.parse(newFilePath);
    const tempFilePath = path.format({ dir, name: name + '.tmp', ext });

    await fsp.mkdir(path.dirname(tempFilePath), { recursive: true });
    await fsp.copyFile(originalfilePath, tempFilePath);

    try {
      await fsp.rename(tempFilePath, newFilePath);
    } catch (err) {
      console.log(err);
      const isExists = err.TODO.TODO;
      if (isExists) {
        await fsp.unlink(newFilePath);
        await fsp.rename(tempFilePath, newFilePath);
      } else {
        throw err;
      }
    }

    if (strategy === TransferStrategyEnum.MOVE) {
      await fsp.unlink(originalfilePath);
    }
  }

  getFilesToTransfer(cardFiles, storageFiles) {
    const untransferredFiles = [];
    const transferredFiles = [];
    const conflictFiles = [];

    for (const storageFile of storageFiles) {
      const cardFile = cardFiles.find(cardFile => cardFile.originalRelativePath === storageFile.originalRelativePath);
      if (cardFile) {
        conflictFiles.push(cardFile);
      } else {
        transferredFiles.push(storageFile);
      }
    }

    for (const cardFile of cardFiles) {
      const conflictFile = conflictFiles.find(conflictFile => conflictFile.originalRelativePath === cardFile.originalRelativePath);
      if (!conflictFile) {
        untransferredFiles.push(cardFile);
      }
    }

    return { untransferredFiles, transferredFiles, conflictFiles };
  }

  reslolveConflictFiles(conflictFiles, conflictResoleStrategy) {
    const resolvedFiles = [];
    for (const conflictFile of conflictFiles) {
      switch (conflictResoleStrategy) {
        case ConflictResoleStrategyEnum.FAIL:
          throw new Error(`Conflict detected: ${conflictFile.originalRelativePath}`);
        case ConflictResoleStrategyEnum.KEEPBOTH:
          const { dir, name, ext } = path.parse(conflictFile.originalRelativePath);
          const newRelativePath = path.format({ dir, name: name + '.new', ext });
          conflictFile.newRelativePath = newRelativePath;
          resolvedFiles.push(conflictFile);
          break;
        case ConflictResoleStrategyEnum.SKIP:
          break;
        case ConflictResoleStrategyEnum.OVERWRITE:
          resolvedFiles.push(conflictFile);
          break;
        default:
          throw new Error(`Invalid conflict resolve strategy: ${conflictResoleStrategy}`);
      }
    }
    return resolvedFiles;
  }

  async getFilesToTransferWithoutConflict(cardFolderPath, storageFolderPath, transferStrategy, conflictResoleStrategy) {
    const cardFiles = await this.getFiles(cardFolderPath);
    const storageFiles = await this.getFiles(storageFolderPath);
    const { untransferredFiles: wasUntransferredFiles, transferredFiles: wasTransferredFiles, conflictFiles: wasConflictFiles } = this.getFilesToTransfer(cardFiles, storageFiles);
    const resolvedConflictFiles = this.reslolveConflictFiles(wasConflictFiles, conflictResoleStrategy);
    const nowTransferringFiles = wasUntransferredFiles.concat(resolvedConflictFiles);
    //printPriorStats(wasUntransferredFiles, wasTransferredFiles, wasConflictFiles, resolvedConflictFiles, nowTransferringFiles, transferStrategy, conflictResoleStrategy);
    return nowTransferringFiles;
  }

  async transferFiles(cardFolderPath, storageFolderPath, transferStrategy = TransferStrategyEnum.MOVE, conflictResoleStrategy = ConflictResoleStrategyEnum.OVERWRITE) {
    const nowTransferringFiles = await this.getFilesToTransferWithoutConflict(cardFolderPath, storageFolderPath, transferStrategy, conflictResoleStrategy);

    const totalFiles = nowTransferringFiles.length;
    const totalBytes = nowTransferringFiles.reduce((bytes, nowTransferringFile) => {
      return bytes + nowTransferringFile.metadata.size;
    }, 0);

    this.progressStat.reset(totalFiles, totalBytes);
    const nowTransferredFiles = [];
    for (const nowTransferringFile of nowTransferringFiles) {
      await this.transferFile(nowTransferringFile, cardFolderPath, storageFolderPath, transferStrategy);
      nowTransferredFiles.push(nowTransferringFile);
      //printProgressStats(nowTransferringFiles, nowTransferredFiles, transferStrategy, conflictResoleStrategy);
      this.progressStat.update(nowTransferringFile.newRelativePath, nowTransferringFile.metadata.size);
    }
    //printFinalStats(nowTransferringFiles, nowTransferredFiles, transferStrategy, conflictResoleStrategy);
    this.progressStat.end();
  }
}
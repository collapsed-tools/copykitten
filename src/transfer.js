import fsp from 'fs/promises';
import path from 'path';
import { printPriorStats, printProgressStats, printFinalStats } from './print.js'

class File {
  constructor(relativePath) {
    this.relativePath = relativePath;
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
export class TransferStat {
  fileNumber = 0;
  filesNumber = 0;
  reset(filesNumber) {
    this.filesNumber = filesNumber;
  }
}
export class Transferer {
  static shared = new Transferer();
  stat = new TransferStat();
  resetStat(filesNumber) {
    this.stat.reset(filesNumber);
  }
  updateStat() {
    this.stat.fileNumber++;
  }
  async getFiles(folderPath, baseFolderPath = null) {
    baseFolderPath = baseFolderPath || folderPath;
    var files = [];

    const dirEntries = await fsp.readdir(folderPath, { withFileTypes: true });
    for (const entry of dirEntries) {
      const entryPath = path.join(folderPath, entry.name);
      if (entry.isFile()) {
        const relativePath = path.relative(baseFolderPath, entryPath);
        const file = new File(relativePath);
        files.push(file);
      } else if (entry.isDirectory()) {
        const subFolderFiles = await this.getFiles(entryPath, baseFolderPath);
        files = files.concat(subFolderFiles);
      }
    }
    return files;
  }

  async transferFile(cardfile, storageFile, cardFolderPath, storageFolderPath, strategy) {
    const originalfilePath = path.join(cardFolderPath, cardfile.relativePath);
    const newFilePath = path.join(storageFolderPath, storageFile.relativePath);

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
      const cardFile = cardFiles.find(cardFile => cardFile.relativePath === storageFile.relativePath);
      if (cardFile) {
        conflictFiles.push(cardFile);
      } else {
        transferredFiles.push(storageFile);
      }
    }

    for (const cardFile of cardFiles) {
      const conflictFile = conflictFiles.find(conflictFile => conflictFile.relativePath === cardFile.relativePath);
      if (!conflictFile) {
        untransferredFiles.push(cardFile);
      }
    }

    return { untransferredFiles, transferredFiles, conflictFiles };
  }

  reslolveConflictFiles(conflictFiles, conflictResoleStrategy) {
    const resolvedFilePairs = [];
    for (const conflictFile of conflictFiles) {
      switch (conflictResoleStrategy) {
        case ConflictResoleStrategyEnum.FAIL:
          throw new Error(`Conflict detected: ${conflictFile.relativePath}`);
        case ConflictResoleStrategyEnum.KEEPBOTH:
          const { dir, name, ext } = path.parse(conflictFile.relativePath);
          const newFilePath = path.format({ dir, name: name + '.new', ext });
          const newFile = new File(newFilePath);
          resolvedFilePairs.push([conflictFile, newFile]);
          break;
        case ConflictResoleStrategyEnum.SKIP:
          break;
        case ConflictResoleStrategyEnum.OVERWRITE:
          resolvedFilePairs.push([conflictFile, conflictFile]);
          break;
        default:
          throw new Error(`Invalid conflict resolve strategy: ${conflictResoleStrategy}`);
      }
    }
    return resolvedFilePairs;
  }

  async getFilesToTransferWithoutConflict(cardFolderPath, storageFolderPath, transferStrategy, conflictResoleStrategy) {
    const cardFiles = await this.getFiles(cardFolderPath);
    const storageFiles = await this.getFiles(storageFolderPath);
    const { untransferredFiles: wasUntransferredFiles, transferredFiles: wasTransferredFiles, conflictFiles: wasConflictFiles } = this.getFilesToTransfer(cardFiles, storageFiles);
    const wasUntransferredFilePairs = wasUntransferredFiles.map(file => [file, file]);
    const resolvedConflictFilePairs = this.reslolveConflictFiles(wasConflictFiles, conflictResoleStrategy);
    const nowTransferringFilePairs = wasUntransferredFilePairs.concat(resolvedConflictFilePairs);
    printPriorStats(wasUntransferredFiles, wasTransferredFiles, wasConflictFiles, resolvedConflictFilePairs, nowTransferringFilePairs, transferStrategy, conflictResoleStrategy);
    return nowTransferringFilePairs;
  }

  async transferFiles(cardFolderPath, storageFolderPath, transferStrategy = TransferStrategyEnum.MOVE, conflictResoleStrategy = ConflictResoleStrategyEnum.OVERWRITE) {
    const nowTransferringFilePairs = await this.getFilesToTransferWithoutConflict(cardFolderPath, storageFolderPath, transferStrategy, conflictResoleStrategy);
    this.resetStat(nowTransferringFilePairs.length);
    const nowTransferredFiles = [];
    for (const [nowTransferringCardFile, nowTransferringStorageFile] of nowTransferringFilePairs) {
      await this.transferFile(nowTransferringCardFile, nowTransferringStorageFile, cardFolderPath, storageFolderPath, transferStrategy);
      nowTransferredFiles.push(nowTransferringStorageFile);
      printProgressStats(nowTransferringFilePairs, nowTransferredFiles, transferStrategy, conflictResoleStrategy);
      this.updateStat();
    }
    printFinalStats(nowTransferringFilePairs, nowTransferredFiles, transferStrategy, conflictResoleStrategy);
  }
}
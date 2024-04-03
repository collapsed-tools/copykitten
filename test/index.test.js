import fsp from 'fs/promises';
import path from 'path';
import { MockFile, readMockFiles, writeMockFiles } from './mockFile.js';
import { ConflictResoleStrategyEnum, Transferer, TransferStrategyEnum } from '../src/transfer.js';

describe('transferFiles integrational', () => {
  const tempFolder = path.join(process.cwd(), 'temp');
  const testFolderPath = path.join(tempFolder, 'index.test');

  const cardFolderPath = path.join(testFolderPath, 'card');
  const storageFolderPath = path.join(testFolderPath, 'storage');


  beforeAll(async () => {
    await fsp.mkdir(tempFolder, { recursive: true });
  });

  beforeEach(async () => {
    await fsp.rm(testFolderPath, { recursive: true, force: true });
    await fsp.mkdir(testFolderPath, { recursive: true });
    await fsp.mkdir(cardFolderPath, { recursive: true });
    await fsp.mkdir(storageFolderPath, { recursive: true });
  });

  afterEach(async () => {
    await fsp.rm(testFolderPath, { recursive: true, force: true });
  });

  test('Basic - Empty move', async () => {
    const referenceCardMockFilesBeforeTransfer = [];
    const referenceCardMockFilesAfterTransfer = [];
    const referenceStorageMockFilesBeforeTransfer = [];
    const referenceStorageMockFilesAfterTransfer = [];
    const transferStrategy = TransferStrategyEnum.MOVE;
    const conflictResoleStrategy = null;
    await performTransferFilesTest(transferStrategy, conflictResoleStrategy, cardFolderPath, storageFolderPath, referenceCardMockFilesBeforeTransfer, referenceCardMockFilesAfterTransfer, referenceStorageMockFilesBeforeTransfer, referenceStorageMockFilesAfterTransfer);
  });

  test('Basic - Simplest move', async () => {
    const mdate = new Date();
    const referenceCardMockFilesBeforeTransfer = [
      new MockFile('single.txt', 'content', mdate),
    ];
    const referenceCardMockFilesAfterTransfer = [];
    const referenceStorageMockFilesBeforeTransfer = [];
    const referenceStorageMockFilesAfterTransfer = referenceCardMockFilesBeforeTransfer;
    const transferStrategy = TransferStrategyEnum.MOVE;
    const conflictResoleStrategy = null;
    await performTransferFilesTest(transferStrategy, conflictResoleStrategy, cardFolderPath, storageFolderPath, referenceCardMockFilesBeforeTransfer, referenceCardMockFilesAfterTransfer, referenceStorageMockFilesBeforeTransfer, referenceStorageMockFilesAfterTransfer);
  });

  test('Basic - Move files to empty storage', async () => {
    const mdate = new Date();
    const referenceCardMockFilesBeforeTransfer = [
      new MockFile('file1.txt', 'text content', mdate),
      new MockFile('subfolder/file2.jpg', 'image content', mdate)
    ];
    const referenceCardMockFilesAfterTransfer = [];
    const referenceStorageMockFilesBeforeTransfer = [];
    const referenceStorageMockFilesAfterTransfer = referenceCardMockFilesBeforeTransfer;
    const transferStrategy = TransferStrategyEnum.MOVE;
    const conflictResoleStrategy = null;
    await performTransferFilesTest(transferStrategy, conflictResoleStrategy, cardFolderPath, storageFolderPath, referenceCardMockFilesBeforeTransfer, referenceCardMockFilesAfterTransfer, referenceStorageMockFilesBeforeTransfer, referenceStorageMockFilesAfterTransfer);
  });

  test('Basic - Move files to nonempty folder', async () => {
    const mdate1 = new Date();
    const referenceCardMockFilesBeforeTransfer = [
      new MockFile('file1.txt', 'text content', mdate1),
      new MockFile('subfolder/file2.jpg', 'image content', mdate1)
    ];
    const referenceCardMockFilesAfterTransfer = [];
    const referenceStorageMockFilesBeforeTransfer = [
      new MockFile('file0.txt', 'already here', mdate1),
    ];
    const referenceStorageMockFilesAfterTransfer = [
      new MockFile('file0.txt', 'already here', mdate1),
      new MockFile('file1.txt', 'text content', mdate1),
      new MockFile('subfolder/file2.jpg', 'image content', mdate1)
    ];
    const transferStrategy = TransferStrategyEnum.MOVE;
    const conflictResoleStrategy = null;
    const isBigFileMode = true;
    await performTransferFilesTest(transferStrategy, conflictResoleStrategy, cardFolderPath, storageFolderPath, referenceCardMockFilesBeforeTransfer, referenceCardMockFilesAfterTransfer, referenceStorageMockFilesBeforeTransfer, referenceStorageMockFilesAfterTransfer, isBigFileMode);
  });

  test('Basic - Copy files to empty storage', async () => {
    const mdate = new Date();
    const referenceCardMockFilesBeforeTransfer = [
      new MockFile('file1.txt', 'text content', mdate),
      new MockFile('subfolder/file2.jpg', 'image content', mdate)
    ];
    const referenceCardMockFilesAfterTransfer = referenceCardMockFilesBeforeTransfer;
    const referenceStorageMockFilesBeforeTransfer = [];
    const referenceStorageMockFilesAfterTransfer = referenceCardMockFilesBeforeTransfer;
    const transferStrategy = TransferStrategyEnum.COPY;
    const conflictResoleStrategy = null;
    const isBigFileMode = true;
    await performTransferFilesTest(transferStrategy, conflictResoleStrategy, cardFolderPath, storageFolderPath, referenceCardMockFilesBeforeTransfer, referenceCardMockFilesAfterTransfer, referenceStorageMockFilesBeforeTransfer, referenceStorageMockFilesAfterTransfer, isBigFileMode);
  });

  test('Conflict Resolution - OVERWRITE', async () => {
    const mdate = new Date();
    const referenceCardMockFilesBeforeTransfer = [
      new MockFile('file.txt', 'new content', mdate),
    ];
    const referenceStorageMockFilesBeforeTransfer = [
      new MockFile('file.txt', 'old content', new Date(mdate - 10000))
    ];
    const referenceCardMockFilesAfterTransfer = [];
    const referenceStorageMockFilesAfterTransfer = [
      new MockFile('file.txt', 'new content', mdate),
    ];
    const transferStrategy = TransferStrategyEnum.MOVE;
    const conflictResoleStrategy = ConflictResoleStrategyEnum.OVERWRITE;

    const isBigFileMode = true;
    await performTransferFilesTest(transferStrategy, conflictResoleStrategy, cardFolderPath, storageFolderPath, referenceCardMockFilesBeforeTransfer, referenceCardMockFilesAfterTransfer, referenceStorageMockFilesBeforeTransfer, referenceStorageMockFilesAfterTransfer, isBigFileMode);
  });

  test('Conflict Resolution - KEEPBOTH', async () => {
    const mdate = new Date();
    const referenceCardMockFilesBeforeTransfer = [
      new MockFile('file.txt', 'card content', mdate)
    ];
    const referenceStorageMockFilesBeforeTransfer = [
      new MockFile('file.txt', 'storage content', mdate)
    ];
    const referenceCardMockFilesAfterTransfer = [];
    const referenceStorageMockFilesAfterTransfer = [
      new MockFile('file.txt', 'storage content', mdate),
      new MockFile('file.new.txt', 'card content', mdate)
    ];

    const transferStrategy = TransferStrategyEnum.MOVE;
    const conflictResoleStrategy = ConflictResoleStrategyEnum.KEEPBOTH;

    const isBigFileMode = true;
    await performTransferFilesTest(transferStrategy, conflictResoleStrategy, cardFolderPath, storageFolderPath, referenceCardMockFilesBeforeTransfer, referenceCardMockFilesAfterTransfer, referenceStorageMockFilesBeforeTransfer, referenceStorageMockFilesAfterTransfer, isBigFileMode);
  });

  test('Conflict Resolution - SKIP', async () => {
    const mdate = new Date();
    const referenceCardMockFilesBeforeTransfer = [
      new MockFile('file.txt', 'card content', mdate)
    ];
    const referenceStorageMockFilesBeforeTransfer = [
      new MockFile('file.txt', 'storage content', mdate)
    ];
    const referenceCardMockFilesAfterTransfer = referenceCardMockFilesBeforeTransfer;
    const referenceStorageMockFilesAfterTransfer = referenceStorageMockFilesBeforeTransfer;

    const transferStrategy = TransferStrategyEnum.MOVE;
    const conflictResoleStrategy = ConflictResoleStrategyEnum.SKIP;

    const isBigFileMode = true;
    await performTransferFilesTest(transferStrategy, conflictResoleStrategy, cardFolderPath, storageFolderPath, referenceCardMockFilesBeforeTransfer, referenceCardMockFilesAfterTransfer, referenceStorageMockFilesBeforeTransfer, referenceStorageMockFilesAfterTransfer, isBigFileMode);
  });

  test('Complex Scenario - Merging', async () => {
    const mdate1 = new Date();
    const mdate2 = new Date(Date.now() - 10000); // Older date

    const referenceCardMockFilesBeforeTransfer = [
      new MockFile('file1.txt', 'text content 1', mdate1), // Conflict
      new MockFile('folder1/file2.txt', 'text content 2', mdate1),
      new MockFile('folder1/file3.jpg', 'image content', mdate1)
    ];
    const referenceStorageMockFilesBeforeTransfer = [
      new MockFile('file1.txt', 'different content', mdate2), // Conflict
      new MockFile('folder2/file4.txt', 'unique file', mdate2),
      new MockFile('folder1/file2.tmp.txt', 'will extinct', mdate2) // tmp will be overwritten even with KEEPBOTH strategy  
    ];
    const referenceCardMockFilesAfterTransfer = [];
    const referenceStorageMockFilesAfterTransfer = [
      new MockFile('file1.new.txt', 'text content 1', mdate1),
      new MockFile('file1.txt', 'different content', mdate2),
      new MockFile('folder1/file2.txt', 'text content 2', mdate1),
      new MockFile('folder1/file3.jpg', 'image content', mdate1),
      new MockFile('folder2/file4.txt', 'unique file', mdate2),
    ];

    const transferStrategy = TransferStrategyEnum.MOVE;
    const conflictResoleStrategy = ConflictResoleStrategyEnum.KEEPBOTH;

    const isBigFileMode = true;
    await performTransferFilesTest(transferStrategy, conflictResoleStrategy, cardFolderPath, storageFolderPath, referenceCardMockFilesBeforeTransfer, referenceCardMockFilesAfterTransfer, referenceStorageMockFilesBeforeTransfer, referenceStorageMockFilesAfterTransfer, isBigFileMode);
  });


  test('Complex Scenario - Leftover .tmp File', async () => {
    const mdate = new Date();

    const referenceCardMockFilesBeforeTransfer = [
      new MockFile('document.txt', 'important stuff', mdate)
    ];
    const referenceStorageMockFilesBeforeTransfer = [
      new MockFile('document.tmp.txt', 'some old data', mdate)
    ];
    const referenceCardMockFilesAfterTransfer = [];
    const referenceStorageMockFilesAfterTransfer = referenceCardMockFilesBeforeTransfer;

    const transferStrategy = TransferStrategyEnum.MOVE;
    const conflictResoleStrategy = ConflictResoleStrategyEnum.OVERWRITE;

    const isBigFileMode = true;
    await performTransferFilesTest(transferStrategy, conflictResoleStrategy, cardFolderPath, storageFolderPath, referenceCardMockFilesBeforeTransfer, referenceCardMockFilesAfterTransfer, referenceStorageMockFilesBeforeTransfer, referenceStorageMockFilesAfterTransfer, isBigFileMode);
  });

  test('Fail - Non-existent Source Folder', async () => {
    const nonExistentCardFolderPath = path.join(cardFolderPath, 'missing_folder');
    const referenceCardMockFilesBeforeTransfer = [];
    const referenceCardMockFilesAfterTransfer = [];
    const referenceStorageMockFilesBeforeTransfer = [];
    const referenceStorageMockFilesAfterTransfer = [];

    const transferStrategy = TransferStrategyEnum.COPY; // Or MOVE
    const conflictResoleStrategy = null;

    const isBigFileMode = true;
    await expect(performTransferFilesTest(transferStrategy, conflictResoleStrategy, nonExistentCardFolderPath, storageFolderPath, referenceCardMockFilesBeforeTransfer, referenceCardMockFilesAfterTransfer, referenceStorageMockFilesBeforeTransfer, referenceStorageMockFilesAfterTransfer, isBigFileMode)).rejects.toThrow(/ENOENT: no such file or directory/);  // Check for the specific error type
  });
  test('Fail - Non-existent Destination Folder', async () => {
    const nonExistentStorageFolderPath = path.join(storageFolderPath, 'missing_folder');
    const mdate = new Date();
    const referenceCardMockFilesBeforeTransfer = [
      new MockFile('file.txt', 'content', mdate)
    ];
    const referenceCardMockFilesAfterTransfer = referenceCardMockFilesBeforeTransfer;
    const referenceStorageMockFilesBeforeTransfer = [];
    const referenceStorageMockFilesAfterTransfer = [];

    const transferStrategy = TransferStrategyEnum.MOVE;
    const conflictResoleStrategy = null;

    // Expect an error (likely similar to the 'Non-existent Source Folder' case)  
    const isBigFileMode = true;
    await expect(performTransferFilesTest(transferStrategy, conflictResoleStrategy, cardFolderPath, nonExistentStorageFolderPath, referenceCardMockFilesBeforeTransfer, referenceCardMockFilesAfterTransfer, referenceStorageMockFilesBeforeTransfer, referenceStorageMockFilesAfterTransfer, isBigFileMode)).rejects.toThrow();
  });

  test('Fail - Invalid Source Path', async () => {
    const cardFilePath = path.join(cardFolderPath, 'somedata.txt'); // Ensure this points to a file
    await writeMockFiles([new MockFile('somedata.txt', '...', new Date())], cardFolderPath);

    const referenceCardMockFilesBeforeTransfer = [];
    const referenceCardMockFilesAfterTransfer = [];
    const referenceStorageMockFilesBeforeTransfer = [];
    const referenceStorageMockFilesAfterTransfer = [];

    const transferStrategy = TransferStrategyEnum.COPY; // Or MOVE
    const conflictResoleStrategy = null;

    const isBigFileMode = true;
    await expect(performTransferFilesTest(transferStrategy, conflictResoleStrategy, cardFolderPath, storageFolderPath, referenceCardMockFilesBeforeTransfer, referenceCardMockFilesAfterTransfer, referenceStorageMockFilesBeforeTransfer, referenceStorageMockFilesAfterTransfer, isBigFileMode)).rejects.toThrow();
  });

  test('Fail - Invalid Destination Path', async () => {
    const storageFilePath = path.join(storageFolderPath, 'somedata.txt');
    await writeMockFiles([new MockFile('somedata.txt', '...', new Date())], storageFolderPath);

    const referenceCardMockFilesBeforeTransfer = [];
    const referenceCardMockFilesAfterTransfer = [];
    const referenceStorageMockFilesBeforeTransfer = [];
    const referenceStorageMockFilesAfterTransfer = [];

    const transferStrategy = TransferStrategyEnum.COPY; // Or MOVE
    const conflictResoleStrategy = null;

    const isBigFileMode = true;
    await expect(performTransferFilesTest(transferStrategy, conflictResoleStrategy, cardFolderPath, storageFolderPath, referenceCardMockFilesBeforeTransfer, referenceCardMockFilesAfterTransfer, referenceStorageMockFilesBeforeTransfer, referenceStorageMockFilesAfterTransfer, isBigFileMode)).rejects.toThrow();
  });

});


function textSort(mockFiles) {
  return mockFiles.sort((a, b) => {
    if (a.relativePath < b.relativePath) {
      return -1;
    } else if (a.relativePath > b.relativePath) {
      return 1;
    } else {
      return 0;
    }
  });
}


async function performTransferFilesTest(transferStrategy, conflictResoleStrategy, cardFolderPath, storageFolderPath, referenceCardMockFilesBeforeTransfer, referenceCardMockFilesAfterTransfer, referenceStorageMockFilesBeforeTransfer, referenceStorageMockFilesAfterTransfer, isBigFileMode) {
  const bigFileThreshold = (isBigFileMode) ? 1 : Infinity;
  await writeMockFiles(referenceCardMockFilesBeforeTransfer, cardFolderPath);
  const readedCardMockFilesBeforeTransfer = await readMockFiles(cardFolderPath);
  expect(textSort(readedCardMockFilesBeforeTransfer)).toEqual(textSort(referenceCardMockFilesBeforeTransfer)); // self-test of helper

  await writeMockFiles(referenceStorageMockFilesBeforeTransfer, storageFolderPath);
  const readedStorageMockFilesBeforeTransfer = await readMockFiles(storageFolderPath);
  expect(textSort(readedStorageMockFilesBeforeTransfer)).toEqual(textSort(referenceStorageMockFilesBeforeTransfer)); // self-test of helper
  await Transferer.shared.transferFiles(cardFolderPath, storageFolderPath, transferStrategy, conflictResoleStrategy, bigFileThreshold);

  const readedCardMockFilesAfterTransfer = await readMockFiles(cardFolderPath);
  expect(textSort(readedCardMockFilesAfterTransfer)).toEqual(textSort(referenceCardMockFilesAfterTransfer));
  const readedStorageMockFilesAfterTest = await readMockFiles(storageFolderPath);
  expect(textSort(readedStorageMockFilesAfterTest)).toEqual(textSort(referenceStorageMockFilesAfterTransfer));
}


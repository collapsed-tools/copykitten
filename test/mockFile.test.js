import fsp from 'fs/promises';
import path from 'path';
import { MockFile, writeAndReadMockFiles } from './mockFile.js';


describe('isolated self-test of mockFile helpers, that are to be used later during actual test', () =>  {
  const tempFolder = path.join(process.cwd(), 'temp');
  const testFolderPath = path.join(tempFolder, 'mockFile.test');
  
  beforeAll(async () => {
    await fsp.mkdir(tempFolder, { recursive: true });
  });
  
  beforeEach(async () => {
    await fsp.rm(testFolderPath, { recursive: true, force: true });
    await fsp.mkdir(testFolderPath, { recursive: true });
  });

  afterEach(async () => {
    await fsp.rm(testFolderPath, { recursive: true, force: true });
  });

  test('empty', async () => {
    const mockFiles = []; 
    const readedMockFiles = await writeAndReadMockFiles(testFolderPath, mockFiles);
    expect(readedMockFiles.sort()).toEqual(mockFiles.sort());
  });

  test('basics', async () => {
    const mockFiles = [
      new MockFile('file1.txt', 'simple file', new Date()),
      new MockFile('sub/file2.txt', 'file in subfolder', new Date()),
    ];
    const readedMockFiles = await writeAndReadMockFiles(testFolderPath, mockFiles);
    expect(readedMockFiles.sort()).toEqual(mockFiles.sort());
  });

  test('filename doubling must fail', async () => {
    const mockFiles = [
      new MockFile('file1.txt', 'simple file', new Date()),
      new MockFile('file1.txt', 'exact same name must fail', new Date()),
    ];
    await expect(writeAndReadMockFiles(testFolderPath, mockFiles)).rejects.toThrow();
  });

  test('directory and file with same name collision must fail', async () => {
    const mockFiles = [
      new MockFile('collision.ext', 'i think i am file', new Date()),
      new MockFile('collision.ext/inner.txt', 'i think i am file in folder', new Date()),
    ];
    await expect(writeAndReadMockFiles(testFolderPath, mockFiles)).rejects.toThrow();
  });

});

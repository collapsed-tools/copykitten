import fsp from 'fs/promises';
import path from 'path';
import { Transferer, TransferStrategyEnum, ConflictResoleStrategyEnum } from './transfer.js'
async function tryToRun() {
  const cardFolderPath = 'C:/_work/collapsedutils/copykitten/test/card';
  const storageFolderPath = 'C:/_work/collapsedutils/copykitten/test/storage';
  const transferStrategy = TransferStrategyEnum.MOVE;
  const conflictResoleStrategy = ConflictResoleStrategyEnum.OVERWRITE;

  await Transferer.shared.transferFiles(cardFolderPath, storageFolderPath, transferStrategy, conflictResoleStrategy);
}
await tryToRun();
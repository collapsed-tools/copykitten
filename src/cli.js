#!/usr/bin/env node
import { program } from 'commander';
import fsp from 'fs/promises';

import {
  transferer,
  TransferStrategyEnum,
  ConflictResoleStrategyEnum,
} from './index.js';

async function runTransferAction(options) {
  try {
    await fsp.mkdir(options.destination, { recursive: true });
    await transferer.transferFiles(
      options.source,
      options.destination,
      options.transferStrategy,
      options.conflictStrategy
    );

    console.log('Transfer complete!');
  } catch (err) {
    console.error('Transfer failed:', err);
  }
}

program
  .version('0.0.0')
  .command('transfer')
  .description('Transfer files (you propably looking this command)')
  .requiredOption('-s, --source <path>', 'Source folder path')
  .requiredOption('-d, --destination <path>', 'Destination folder path')
  .option('-t, --transfer-strategy <strategy>', 'Transfer strategy (move or copy)', TransferStrategyEnum.MOVE)
  .option('-c, --conflict-strategy <strategy>', 'Conflict resolution strategy', ConflictResoleStrategyEnum.OVERWRITE)
  .action(async (options) => {    
    await runTransferAction(options);
  });

program.parse(process.argv);



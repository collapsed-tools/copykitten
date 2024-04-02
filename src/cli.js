#!/usr/bin/env node
import { program } from 'commander';
import fsp from 'fs/promises';
import ProgressBar from 'progress';

import {
  transferer,
  TransferStrategyEnum,
  ConflictResoleStrategyEnum,
} from './index.js';

async function runTransferAction(options) {
  try {
    await fsp.mkdir(options.destination, { recursive: true });
    let bar;
    
    transferer.progressStat.ee.on('reset', () => {
      bar = new ProgressBar('[:bar] :yoyo :rate bps :current/:total :etas', { total: transferer.progressStat.total.byte, width: 15, complete:'█', incomplete:'·' });
    });

    transferer.progressStat.ee.on('update', () => {
      bar.update(transferer.progressStat.current.byte / transferer.progressStat.total.byte, {'yoyo': transferer.progressStat.current.fileName });
    });

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



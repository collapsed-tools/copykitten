export function printPriorStats(untransferredFiles, transferredFiles, conflictFiles, resolvedConflictFilePairs, nowTransferringFilePairs, transferStrategy, conflictResoleStrategy) {
  console.log("File Transfer - Initial Statistics");
  console.log("----------------------------------");
  console.log(`Transfer Strategy: ${transferStrategy}`);
  console.log(`Conflict Strategy: ${conflictResoleStrategy}`);
  console.log("\nFiles to Transfer: ", nowTransferringFilePairs.length);
  console.log("  Untransferred: ", untransferredFiles.length);
  console.log("  Already Transferred: ", transferredFiles.length);
  console.log("  Conflicts Resolved: ", resolvedConflictFilePairs.length);
}

export function printProgressStats(nowTransferringFilePairs, nowTransferredFiles, transferStrategy, conflictResoleStrategy) {
  const completed = nowTransferredFiles.length;
  const total = nowTransferringFilePairs.length;
  const percentage = Math.round((completed / total) * 100);

  console.log(`\nProgress: ${completed}/${total} (${percentage}%)`);
}

export function printFinalStats(nowTransferringFilePairs, nowTransferredFiles, transferStrategy, conflictResoleStrategy) {
  console.log("\nFile Transfer Complete");
  console.log("----------------------");
  console.log(`Files Transferred: ${nowTransferredFiles.length}`); 

}

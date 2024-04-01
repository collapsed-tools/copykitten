**@collapsed-tools/copykitten**

Easy image and video file management for moving files from cameras to centralized storage.

## **SOFTWARE IS IN PRE-ALPHA STATE, NOT YET READY TO USE**

## Features

* **Reliable Transfers:**  Moves or copies files between camera storage (e.g., SD cards) and your designated storage locations.
* **Flexible Conflict Resolution:** Handles file conflicts with various strategies:
    * **Overwrite:** Replaces existing files for seamless updates.
    * **Keep Both:** Retains existing files and saves new versions with a ".new" suffix, preventing data loss.
    * **Skip:** Keeps the original file and skips the transfer.
* **Progress Tracking:** Provides updates on the transfer process.

#### TODO
* **TODO: Handles Camera Disconnects:** Transfers continue seamlessly if the camera is disconnected and reconnected.
* **TODO: Media subfolder whitelist:** Automatically detect media-related subfolders, like 'DCIM', 'CLIP', 'CameraNN', etc.

## Installation

```bash
npm install @collapsed-tools/copykitten
```

## Basic usage

#### CLI
```bash
cli transfer -s /path/to/camera -d /path/to/storage
```

#### Javascript
```javascript
import { transferer } from '@collapsed-tools/copykitten';
await transferer.transferFiles('/path/to/images', '/path/to/storage');
```

## With parameters

#### CLI
```bash
cli transfer \
   --source /path/to/camera \
   --destination /path/to/storage \
   --transfer-strategy copy \
   --conflict-strategy keepboth 
```

#### Javascript
```javascript
import { transferer, TransferStrategyEnum, ConflictResoleStrategyEnum } from '@collapsed-tools/copykitten';
await transferer.transferFiles( 
  '/path/to/camera', 
  '/path/to/storage', 
  TransferStrategyEnum.COPY,
  ConflictResoleStrategyEnum.KEEPBOTH 
);
```

## Explanation of strategies

* **Transfer**: Default is `move` strategy, but for some custom approaches `copy` are available.
* **Conflict**: Determines how to handle conflicts when files with the same name exist in the destination. Possible values are: `overwrite`, `keepboth`, `skip`, `fail`.

## Contributing 

Contributions are always welcome! Feel free to open pull requests or issues for bug reports, feature requests, or improvements.

## License

This project is licensed under the ISC License. See the LICENSE file for details.
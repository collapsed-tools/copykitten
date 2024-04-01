**@collapsed-tools/copykitten**

Easy image and video file management for moving files from cameras to centralized storage.

**Features**

* **Reliable Transfers:**  Moves or copies files between camera storage (e.g., SD cards) and your designated storage locations.
* **Flexible Conflict Resolution:** Handles file conflicts with various strategies:
    * **Overwrite:** Replaces existing files for seamless updates.
    * **Keep Both:** Retains existing files and saves new versions with a ".new" suffix, preventing data loss.
    * **Skip:** Keeps the original file and skips the transfer.
* **Progress Tracking:** Provides updates on the transfer process.
* **TODO: Handles Camera Disconnects:** Transfers continue seamlessly if the camera is disconnected and reconnected.
* **TODO: Media subfolder whitelist:** Automatically detect media-related subfolders, like 'DCIM', 'CLIP', 'CameraNN', etc.

**Installation**

```
npm install @collapsed-tools/copykitten
```

**Usage**

Here's a basic example with the command-line interface (yep, for now you need to add `--` after `npm run cli` to pass parameters down to script, will be fixed):

```
npm run cli -- \
   --source /path/to/your/camera/folder \
   --destination /path/to/your/storage \
   --transfer-strategy move \
   --conflict-strategy overwrite 
```

**Explanation of Options**

* `--source`: The path to the source folder containing the files you want to transfer.
* `--destination`: The path to the folder where you want to transfer the files.
* `--transfer-strategy`: Specifies whether to move (`move`) or copy (`copy`) files.
* `--conflict-strategy`: Determines how to handle conflicts when files with the same name exist in the destination. Possible values are: `overwrite`, `keepboth`, `skip`.

**Integrating into Your Workflow**

You can easily incorporate `copykitten` into your scripts or larger applications. Here's an example of how to use it within your Node.js code:

```javascript
const { transferer } = require('@collapsed-tools/copykitten');
const sourcePath = '/path/to/images';
const destinationPath = '/path/to/storage';

await transferer.transferFiles(sourcePath, destinationPath);
```

```javascript
const { transferer, TransferStrategyEnum, ConflictResoleStrategyEnum } = require('@collapsed-tools/copykitten');
const sourcePath = '/path/to/images';
const destinationPath = '/path/to/storage';

await transferer.transferFiles( 
  sourcePath, 
  destinationPath, 
  TransferStrategyEnum.COPY,
  ConflictResoleStrategyEnum.KEEPBOTH 
);
```

**Contributing** 

Contributions are always welcome! Feel free to open pull requests or issues for bug reports, feature requests, or improvements.

**License**

This project is licensed under the ISC License. See the LICENSE file for details.
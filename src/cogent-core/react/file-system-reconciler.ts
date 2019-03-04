import * as crypto from 'crypto';
import * as fs from 'fs';
import * as path from 'path';
import { ICogentOptions } from '../../cogent-engines/cogent-engine';
import { IFileSystemRendererFolder } from './file-system-renderer';

// usage: emit to a temp folder, check hash against real target folder, prompt user, etc.
// assume target directory exists and is empty...so no checking for existing files
class FileSystemReconciler {
  emit(folder: IFileSystemRendererFolder, options: ICogentOptions) {
    const hash = crypto.createHash('sha256').update(JSON.stringify(folder), 'utf8').digest().toJSON();
    fs.writeFileSync(path.join(options.outputDirectory, '.cogent-lock'), JSON.stringify({ hash }));

    Object.keys(folder.folders)
      .forEach((folderName: string) => {
        const outputDirectory = path.join(options.outputDirectory, folderName);
        fs.mkdirSync(outputDirectory);

        const f = folder.folders[folderName];
        this.emit(f, { ...options, outputDirectory });
      });
    Object.keys(folder.files)
      .forEach((fileName: string) => {
        const file = folder.files[fileName];
        fs.writeFileSync(path.join(options.outputDirectory, fileName), file.contents.join(''));
      });
  }

}

export {
  FileSystemReconciler,
};

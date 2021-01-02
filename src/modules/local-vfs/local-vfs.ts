import fsx from 'fs-extra';
import { join } from 'path';
import { promisify } from 'util';

const stat: (path: Parameters<typeof fsx.stat>[0]) => Promise<void> = promisify(
  fsx.stat
);
export interface Vfs {
  //init: (root: string) => Promise<void>;
  save: (data: Buffer | string, ...pathToken: string[]) => Promise<void>;
  addFile: (src: string, ...pathToken: string[]) => Promise<string>;
  read: (...pathToken: string[]) => Promise<Buffer>;
  remove: (...pathToken: string[]) => Promise<void>;
  exists(...pathToken: string[]): Promise<boolean>;
}

// const log = require('pino')();
export default class LocalVfs implements Vfs {
  workDir: () => string;
  constructor({ root = './vfs' }: { root: string }) {
    this.workDir = () => root;
    if (!fsx.existsSync(this.workDir())) {
      fsx.emptyDirSync(this.workDir());
      fsx.mkdirpSync(this.workDir());
    }
  }
  resolvePath = (...pathToken: string[]): string => {
    return join(this.workDir(), ...pathToken);
  };

  save = async (data: any, ...pathToken: string[]): Promise<void> => {
    await fsx.writeFile(this.resolvePath(...pathToken), data);
  };

  addFile = async (src: string, ...pathToken: string[]): Promise<string> => {
    await fsx.move(src, this.resolvePath(...pathToken), { overwrite: true });
    return this.resolvePath(...pathToken);
  };

  read = async (...pathToken: string[]): Promise<any> => {
    const content = await fsx.readFile(this.resolvePath(...pathToken));
    return content;
  };

  remove = async (...pathToken: string[]): Promise<void> => {
    return fsx.remove(this.resolvePath(...pathToken));
  };
  exists = async (...pathToken: string[]) => {
    try {
      await stat(this.resolvePath(...pathToken));
      return true;
    } catch (err) {
      return false;
    }
  };
}

module.exports = LocalVfs;

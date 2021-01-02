import { get, set, merge } from 'lodash';

export default class Config {
  read: () => Promise<any>;
  write: (data: any) => Promise<any>;
  defaults: any;

  constructor({
    read,
    write,
    defaults,
  }: Pick<Config, 'read' | 'write' | 'defaults'>) {
    this.read = read;
    this.write = write;
    this.defaults = defaults;
  }
  /**
   * @param {string} path
   *
   * @memberof Config
   */
  get = async (path: string) => {
    const config = (await this.read()) || (await this.write(this.defaults));
    return path ? get(config, path.replace(/\//g, '.')) : config;
  };

  /**
   * @param {string} path
   * @param {any} value
   * @returns {Promise<any>}
   * @memberof Config
   */
  set = async (path: string, value: any) => {
    const config = await this.read();
    const newConf = set(config, path.replace(/\//g, '.'), value);
    return this.write(newConf);
  };

  update = async (path: string, newConfigs: any) => {
    const currentConf = await this.get(path);
    const newConf = merge(currentConf, newConfigs);
    return this.set(path, newConf);
  };
}

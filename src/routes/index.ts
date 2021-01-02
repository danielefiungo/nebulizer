import express from 'express';
import yaml from 'js-yaml';
import LocalVfs from '../modules/local-vfs/local-vfs';
import Nebula from '../modules/nebula-js/nebula-js';
import Conf from '../modules/conf/conf';
import network from './network';
//import  from './host.ts_';

const vfs = new LocalVfs({ root: './fs' });

const read = async () => {
  if (await vfs.exists('nebula.yaml')) {
    return yaml.safeLoad((await vfs.read('nebula.yaml')).toString('utf8'));
  }
  return {
    version: 'v1',
    nebula: {
      version: 'v1.3.0',
    },
  };
};
const write = async (newConfig: any) => {
  vfs.save(yaml.safeDump(newConfig), 'nebula.yaml');
  return await read();
};

const conf = new Conf({
  read,
  write,
  defaults: { version: 'v1', nebula: { version: 'v1.3.0' } },
});

const nebula = Nebula(vfs, conf);

const router = express.Router();

router.use(network(nebula));
//router.use(ca(nebula));

// router.use('/', payrollRouter);
// router.use(errors());

export default router;

const express = require('express');
const yaml = require('js-yaml');
const LocalVfs = require('@fiungos/local-vfs');
const { Nebula } = require('@fiungos/nebula');
const Conf = require('@fiungos/conf');
const network = require('./network');
const ca = require('./host');

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
const write = async (newConfig) => {
  vfs.save(yaml.safeDump(newConfig), 'nebula.yaml');
  return await read();
};

const conf = new Conf({
  read,
  write,
  defaults: { version: 'v1', nebula: { version: 'v1.1.0' } },
});

const nebula = Nebula(vfs, conf);

const router = express.Router();

router.use(network(nebula));
router.use(ca(nebula));

// router.use('/', payrollRouter);
// router.use(errors());
module.exports = router;

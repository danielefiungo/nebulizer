import { Vfs } from './../local-vfs/local-vfs';
import { spawn } from 'child_process';
import { join } from 'path';
import request from 'request';
import os from 'os';
import tar from 'tar';
import fs from 'fs-extra';
import _debug from 'debug';
import Config from '../conf/conf';
const debug = _debug('nebula:module');

const nebulaLib = `${process.cwd()}/lib/nebula/`;
const nebulaBin = join(nebulaLib, 'nebula');
const nebulaCertBin = join(nebulaLib, 'nebula-cert');
const hostsConfigBase = 'hosts';
const caConfigBase = 'ca';

export default function Nebula(vfs: Vfs, conf: Config) {
  function execNebulaCert(...args: any[]) {
    return new Promise((resolve, reject) => {
      const certPs = spawn(nebulaCertBin, args);
      certPs.on('exit', res => {
        if (res === 0) {
          resolve(res);
        } else {
          reject(res);
        }
      });
      certPs.stderr.on('data', (...data) => {
        debug('stderr: %O', data.toString());
        reject(data);
      });
    });
  }

  function networkPath({ name }: { name: string }) {
    return `networks/${name}`;
  }

  function networkCAPath({ network }: { network: string }) {
    return `${networkPath({ name: network })}/${caConfigBase}`;
  }

  function hostPath({ network, name }: { network: string; name: string }) {
    return `${networkPath({ name: network })}/${hostsConfigBase}/${name}`;
  }

  async function createNetwork({ name }: { name: string }) {
    const tmpCAHome = `${os.tmpdir}/${networkCAPath({ network: name })}`;
    const crtPath = join(tmpCAHome, `/ca.crt`);
    const keyPath = join(tmpCAHome, `/ca.key`);
    await fs.emptyDir(tmpCAHome);

    await execNebulaCert(
      'ca',
      '-name',
      name,
      '-out-crt',
      crtPath,
      '-out-key',
      keyPath
    );

    const response = {
      name,
      crt: await vfs.addFile(
        crtPath,
        networkCAPath({ network: name }),
        `/ca_${name}.crt`
      ),
      key: await vfs.addFile(
        keyPath,
        networkCAPath({ network: name }),
        `/ca_${name}.key`
      ),
    };
    await conf.set(networkPath({ name }), { name });
    return conf.set(networkCAPath({ network: name }), response);
  }
  /**
   * Wrapper of
   * $ nebula-cert sign -help
   * Usage of nebula-cert sign <flags>: create and sign a certificate
   *   -ca-crt string
   *         Optional: path to the signing CA cert (default "ca.crt")
   *   -ca-key string
   *         Optional: path to the signing CA key (default "ca.key")
   *   -duration duration
   *         Required: how long the cert should be valid for. Valid time units are seconds: "s", minutes: "m", hours: "h"
   *   -groups string
   *         Optional: comma separated list of groups
   *   -in-pub string
   *         Optional (if out-key not set): path to read a previously generated public key
   *   -ip string
   *         Required: ip and network in CIDR notation to assign the cert
   *   -name string
   *         Required: name of the cert, usually a hostname
   *   -out-crt string
   *         Optional: path to write the certificate to
   *   -out-key string
   *         Optional (if in-pub not set): path to write the private key to
   *   -subnets string
   *         Optional: comma seperated list of subnet this cert can serve for
   */
  async function createHost({
    network,
    name,
    ip,
    groups = [],
  }: {
    name: string;
    network: string;
    ip: string;
    groups?: string[];
  }) {
    const groupOpts = groups.join(',');

    const caCrtPath = await conf.get(`${networkCAPath({ network })}.crt`);
    const caKeyPath = await conf.get(`${networkCAPath({ network })}.key`);

    const tmpCertFs = `${os.tmpdir}/${hostPath({ network, name })}`;
    const crtPath = join(tmpCertFs, `/${network}_${name}.crt`);
    const keyPath = join(tmpCertFs, `/${network}_${name}.key`);

    await fs.emptyDir(tmpCertFs);

    await execNebulaCert(
      'sign',
      '-name',
      name,
      '-ip',
      ip,
      '-ca-crt',
      caCrtPath,
      '-ca-key',
      caKeyPath,
      '-groups',
      groupOpts,
      '-out-crt',
      crtPath,
      '-out-key',
      keyPath
    );

    const response = {
      name,
      crt: await vfs.addFile(
        crtPath,
        hostPath({ network, name }),
        `/id_nebula.crt`
      ),
      key: await vfs.addFile(
        keyPath,
        hostPath({ network, name }),
        `/id_nebula.key`
      ),
      groups,
      ip,
    };
    await conf.set(hostPath({ network, name }), response);
    return response;
  }

  async function findHostByName({
    network,
    name,
  }: {
    name: string;
    network: string;
  }) {
    return conf.get(hostPath({ name, network }));
  }

  async function findNetworkByName({ name }: { name: string }) {
    return conf.get(networkPath({ name }));
  }

  return {
    createNetwork,
    createHost,
    findHost: findHostByName,
    findNetwork: findNetworkByName,
  };
}

/** Useful nebula binary installer */
export async function installNebula() {
  if (!fs.existsSync(nebulaBin) || !fs.existsSync(nebulaCertBin)) {
    await fs.emptyDir(nebulaLib);
    await downloadNebula();
  }
}

function downloadNebula(): Promise<void> {
  return new Promise((resolve, reject) => {
    const binRepo = `https://github.com/slackhq/nebula/releases/download/v1.3.0/nebula-${os.platform()}-amd64.tar.gz`;
    debug(`nebula runtime not found!  trying download from ${binRepo} ...`);
    request(binRepo)
      .pipe(tar.x({ cwd: nebulaLib }))
      .on('close', () => {
        debug('nebula runtime downloaded!');
        resolve();
      })
      .on('error', err => reject(err));
  });
}

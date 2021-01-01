const express = require('express');
const debug = require('debug')('nebula:api');
const httpStatus = require('http-status');
/**
 *
 * @param {import('@fiungos/nebula').Nebula} nebula
 */
function networkRouter(nebula) {
  const router = express.Router();

  router.route('/network').post(async (req, res, next) => {
    res.json(req.headers);
    res.status(httpStatus.OK);
  });

  router
    .route('/network/:name')
    .get(async (req, res) => {
      const { name } = req.params;

      const response = await nebula.findNetwork({ name });
      if (!response) {
        res.sendStatus(httpStatus.NOT_FOUND);
        return;
      }
      res.status(httpStatus.OK);
      res.json(response);
    })
    .post(async (req, res) => {
      const { name } = req.params;
      const response = await nebula.createNetwork({ name });
      res.json(response);
      res.status(httpStatus.CREATED);
    });

  router
    .route('/network/:network/host/:name')
    .get(async (req, res) => {
      const { network, name } = req.params;

      const response = await nebula.findHost({ network, name });

      res.json(response);

      res.status(httpStatus.OK);
    })
    .post(async (req, res) => {
      const { network, name } = req.params;
      const { ip, groups } = req.body;
      const response = await nebula.createHost({ network, ip, name, groups });

      res.json(response);

      res.status(httpStatus.OK);
    });
  return router;
}
module.exports = networkRouter;

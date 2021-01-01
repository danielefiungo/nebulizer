const express = require('express');
const debug = require('debug')('nebulaservice:api');
const httpStatus = require('http-status');
const nebula = require('@fiungos/nebula');

function certAuthRouter(nebula) {
  const router = express.Router();

  router.route('/network').post(async (req, res, next) => {
    res.json(req.headers);
    res.status(httpStatus.OK);
  });

  router
    .route('/network/:caname')
    .get(async (req, res, next) => {
      const { name } = req.params;

      const response = await nebula.findHost({ name });

      res.json(response);

      res.status(httpStatus.OK);
    })
    .post(async (req, res, next) => {
      const { name } = req.params;
      const { ip, groups } = req.body;
      const response = await nebula.createHost({ ip, name, groups });

      res.json(response);

      res.status(httpStatus.OK);
    });

  return router;
}
module.exports = certAuthRouter;

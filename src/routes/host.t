import { Router } from 'express';
import { OK } from 'http-status';
import Nebula from '../modules/nebula-js/nebula-js';

function certAuthRouter(nebula: ReturnType<typeof Nebula>) {
  const router = Router();

  router.route('/network').post(async (req, res, next) => {
    res.json(req.headers);
    res.status(OK);
  });

  router
    .route('/network/:caname')
    .get(async (req, res, next) => {
      const { name } = req.params;

      const response = await nebula.findHost({ name });

      res.json(response);

      res.status(OK);
    })
    .post(async (req, res, next) => {
      const { name } = req.params;
      const { ip, groups } = req.body as {
        ip: string;
        groups: string[] | undefined;
      };
      const response = await nebula.createHost({ ip, name, groups });

      res.json(response);

      res.status(OK);
    });

  return router;
}
export default certAuthRouter;


import {Router} from 'express';
import music from './albums.js'


const routes = new Router();



routes.use('/api', music )

export default routes;
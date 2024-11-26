import express from 'express';
import routes from './src/routes/index.js';
import cors from 'cors';

const PORT = 3001;

class App{
    constructor(){
        this.app =  express()
        this.middlewares()
        this.routes()
    }

    middlewares(){
        this.app.use(cors())
    }

    routes(){
        this.app.use(routes)
    }

  
 
}


export default new App().app

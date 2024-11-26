import express from 'express';

import puppeteer from 'puppeteer';

const router = express.Router();



let cachedData = null;
let lastCacheUpdate = null;
const CACHE_DURATION = 60 * 60 * 1000; 
let browser;


const startBrowser = async () => {
    if (!browser) {
      browser = await puppeteer.launch({
        headless: true,
        args: ['--no-sandbox', '--disable-setuid-sandbox', '--disable-dev-shm-usage'], 
      });
    }
    return browser;
  };



const scrapeAlbums = async (artistUrl) => {


    const browser = await startBrowser();
    const page = await browser.newPage();

    await page.setRequestInterception(true);
    page.on('request', (request) => {
        const resourceType = request.resourceType();
        if(['stylesheet', 'font', 'image',].includes(resourceType)) {
            request.abort();
        } else {
            request.continue();
        }
    });

    await page.goto(artistUrl, {waitUntil: 'domcontentloaded'});

    await page.evaluate(() => {
        window.scrollBy(0, document.body.scrollHeight);
    });




    const albums = await page.evaluate(() => {
        return Array.from(document.querySelectorAll('#music-grid .music-grid-item')).map((album) => {
         const titleElement =  album.querySelector('.title');
         const title = titleElement ? titleElement.childNodes[0]?.textContent.trim() : null;
          const artists = album.querySelector('.artist-override')?.textContent.trim()
          const url =  album.querySelector('a')?.href

         const imgElement = album.querySelector('.art img');
         let coverart = imgElement?.src 

         if(coverart && coverart.includes('0.gif')){
            coverart =  imgElement?.getAttribute('data-original') ||  imgElement?.getAttribute('data-lazyload') || coverart;
         }
          
            return { title, artists, url, coverart};
        }).filter(album => album.title && album.url);
      });

      await page.close()
      return albums;

};



router.get('/music', async (req, res) => {
    const artistUrl = 'https://simbiosesounds.bandcamp.com/';
    const now = Date.now();


    if(cachedData && now - lastCacheUpdate < CACHE_DURATION) {
        return res.json(cachedData);
    }


    try{
        const albums = await scrapeAlbums(artistUrl);
        cachedData = albums;
        lastCacheUpdate = now;

        res.json(albums);
    } catch(error) {
        console.error('Erro ao obter a discografia:', error);
        console.error(error.stack);
        res.status(500).json({error: 'Erro ao obter a discografia', message: error.message});

    }
});

process.on('SIGINT', async () => {

    try{
        if(browser) await browser.close();
    } catch(err){
        console.error('Erro ao fechar o navegador:', err);
    }
   
    process.exit()
});





// router.get('/music', async (req, res) => {
   
//         const  artistUrl = 'https://simbiosesounds.bandcamp.com/' 
    

//     try{
//        const browser = await puppeteer.launch({ headless: true });
//        const page = await browser.newPage();
//        await page.goto(artistUrl, {waitUntil: 'networkidle2'});

//        const albums = await page.evaluate(() => {
//             const albumElements = document.querySelectorAll('#music-grid .music-grid-item');
//             const albumList = [];

//         albumElements.forEach((album) => {
//             const coverart = album.querySelector('.art img')?.src;
//             const title = album.querySelector('.title')?.textContent.trim();
//             const artists = album.querySelector('.artist-override')?.textContent.trim();
//             const url = album.querySelector('a')?.href;

//             if(title && url){
//                 albumList.push({title, artists, url, coverart});
//             }
            
//         });
//         return albumList
//        });

//        await browser.close()
//        res.json(albums)
// } catch(error) {
//     console.error('Erro ao obter a discografia:', error);
//         res.status(500).json({ error: 'Erro ao obter a discografia' });
// }

// });


export default router;
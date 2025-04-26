
import { readFile, writeFile } from 'fs/promises';
import {createServer} from 'http'
import path from 'path'
import crypto from 'crypto'
const PORT = 3006;
const DATA_FILE = path.join('data','links.json');
//LOAD LINKS
const loadLinks = async() => {
try {
    const data = await readFile(DATA_FILE, 'utf-8');
    return JSON.parse(data)
} catch (error) {
    if(error.code === 'ENOENT')
    {
        await writeFile(DATA_FILE, JSON.stringify({}),'utf-8');
        return {};
    }
    throw error;
}
}
const saveLinks = async(links) => {
    try {
        await writeFile(DATA_FILE,JSON.stringify(links),'utf-8');
    } catch (error) {
        console.error(error)
    }
}


const serveFile = async(res,filePath,contentType) => {
    try {
        const data = await readFile(filePath,"utf-8")
        res.writeHead(200,{'Content-Type': contentType});
        res.end(data)
    } catch (error) {
        res.writeHead(404,{'Content-Type': 'text/plain'});
        res.end('404 Page Not Found')
    }
}
const server = createServer(async(req,res) => {
if(req.method === 'GET' && req.url !== '/links')
{
    if(req.url === '/'){
       await serveFile(res,path.join("public","index.html"),'text/html');
    }
    else if(req.url === '/style.css')
    {
        await serveFile(res,path.join("public","style.css"),'text/css');
    }
    else {
        const links = await loadLinks();
        const shortCode =req.url.slice(1);
        if (links[shortCode])
        {
            res.writeHead(302,{location: links[shortCode]})
            return res.end();
        }
        res.writeHead(404,{'Content-Type': 'text/plain'});
        return res.end("shortcode not found")
    }
}
else if(req.method === 'POST' && req.url === '/shorten')
{    
    const links = await loadLinks()
    let body = "";
    req.on('data',(chunk) => {
        body = body + chunk;
        return body;
    })
    req.on('end',async() =>{
     console.log(body)
     const {url, shortCode} = JSON.parse(body)
     if(!url)
     {
        res.writeHead(400,{"Content-Type": 'text/plain'});
        return res.end('URL is required');
     }
     const finalShortCode = shortCode || crypto.randomBytes(4).toString('hex');
     if(links[finalShortCode])
     {
        res.writeHead(400,{"Content-Type": 'text/plain'});
        return res.end('Short Code already exists. Please choose another');
     }

     links[finalShortCode] = url;
     await saveLinks(links);
     res.writeHead(200,{'COntent-Type': 'application/json'})
     res.end(JSON.stringify({success: true, shortCode: finalShortCode}));
    })
}
else if(req.url === '/links' && req.method === 'GET')
{
    const links = await loadLinks();
    res.writeHead(200,{"Content-Type": 'application/json'});
    return res.end(JSON.stringify(links))
}
}

)
server.listen(PORT ,() => {
    console.log(`Server Running At Port ${PORT}`)
})
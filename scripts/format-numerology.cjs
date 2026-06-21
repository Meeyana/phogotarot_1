const fs = require('fs');
const path = require('path');

function processDir(dir) {
    for (let f of fs.readdirSync(dir)) {
        let p = path.join(dir, f);
        if (fs.statSync(p).isDirectory()) {
            processDir(p);
        } else if (p.endsWith('.md')) {
            let c = fs.readFileSync(p, 'utf8');
            // replace strong
            c = c.replace(/<strong>([\s\S]*?)<\/strong>/g, '**$1**');
            c = c.replace(/<b>([\s\S]*?)<\/b>/g, '**$1**');
            // replace em
            c = c.replace(/<em>([\s\S]*?)<\/em>/g, '*$1*');
            c = c.replace(/<i>([\s\S]*?)<\/i>/g, '*$1*');
            // replace br
            c = c.replace(/<br\s*\/?>/gi, '\n\n');
            // replace p
            c = c.replace(/<p>/g, '');
            c = c.replace(/<\/p>/g, '\n\n');
            // clean up multiple newlines
            c = c.replace(/\n{3,}/g, '\n\n');
            
            fs.writeFileSync(p, c, 'utf8');
        }
    }
}
processDir('src/content/numerology');
console.log('Done!');

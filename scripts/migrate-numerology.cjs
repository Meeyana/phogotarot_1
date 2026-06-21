const fs = require('fs');
const path = require('path');
const yaml = require('js-yaml'); // You may need to run `npm install js-yaml`

const jsonPath = path.join(__dirname, '../src/data/numerology-data.json');
const outDir = path.join(__dirname, '../src/content/numerology');

// Read JSON
const rawData = fs.readFileSync(jsonPath, 'utf8');
const data = JSON.parse(rawData);

// Helper to convert a single block array to markdown
function blocksToMarkdown(blocks) {
    if (!blocks || !Array.isArray(blocks)) return '';
    let md = '';
    for (const block of blocks) {
        if (block.title) {
            md += `### ✦ ${block.title}\n\n`;
        }
        if (block.type === 'list' && block.items) {
            for (const item of block.items) {
                // Ensure items don't have stray <p> tags and format as bullet points
                const cleanItem = item.replace(/<p>|<\/p>/g, '').trim();
                md += `- ${cleanItem}\n`;
            }
            md += '\n';
        } else if (block.type === 'quote' && block.content) {
            const cleanContent = block.content.replace(/<p>|<\/p>/g, '').trim();
            md += `> ${cleanContent}\n\n`;
        } else if ((block.type === 'text' || !block.type) && block.content) {
            const cleanContent = block.content.replace(/<p>|<\/p>/g, '\n\n').replace(/\n\n\n/g, '\n\n').trim();
            md += `${cleanContent}\n\n`;
        }
    }
    return md.trim();
}

function processCategory(categoryName, categoryObj, subFolder = null) {
    if (!categoryObj || typeof categoryObj !== 'object') return;
    
    for (const key in categoryObj) {
        const item = categoryObj[key];
        
        let targetDir = path.join(outDir, categoryName);
        if (subFolder) {
            targetDir = path.join(targetDir, subFolder);
        }
        
        // Ensure dir exists
        if (!fs.existsSync(targetDir)) {
            fs.mkdirSync(targetDir, { recursive: true });
        }
        
        const filePath = path.join(targetDir, `${key}.md`);
        
        let title = item.title || "";
        let bodyMd = "";
        
        if (item.blocks) {
            bodyMd = blocksToMarkdown(item.blocks);
        } else if (item.content) {
            bodyMd = item.content.replace(/<p>|<\/p>/g, '\n\n').replace(/\n\n\n/g, '\n\n').trim();
        } else if (item.meaning) {
            // Some specific categories like arrow might have 'meaning'
            bodyMd = item.meaning.replace(/<p>|<\/p>/g, '\n\n').replace(/\n\n\n/g, '\n\n').trim();
        } else if (typeof item === 'string') {
            bodyMd = item;
        } else if (Array.isArray(item)) {
            // Handle arrays if any
            bodyMd = blocksToMarkdown(item);
            if (!bodyMd) { // Maybe it's an array of strings
                bodyMd = item.join('\n\n');
            }
        }
        
        const frontmatterObj = {
            category: categoryName,
            number: key
        };
        if (title) frontmatterObj.title = title;
        if (subFolder) frontmatterObj.subCategory = subFolder;
        
        // Handle specific extra fields
        for (const [k, v] of Object.entries(item)) {
            if (k !== 'title' && k !== 'blocks' && k !== 'content' && k !== 'meaning' && typeof v === 'string') {
                frontmatterObj[k] = v;
            }
        }

        const frontmatterStr = yaml.dump(frontmatterObj);
        const finalFile = `---\n${frontmatterStr}---\n\n${bodyMd}\n`;
        
        fs.writeFileSync(filePath, finalFile, 'utf8');
    }
}

// Ensure base dir
if (!fs.existsSync(outDir)) fs.mkdirSync(outDir, { recursive: true });

// Process top-level simple categories
const simpleCategories = ['lifePath', 'destiny', 'soul', 'personality', 'attitude', 'maturity', 'rational', 'karmicDebt', 'karmicLessons', 'periodCycleMeanings', 'personalYear', 'personalMonth', 'personalityChart', 'careerChart', 'strengthGrid', 'synthesisGrid'];

for (const cat of simpleCategories) {
    if (data[cat]) {
        processCategory(cat, data[cat]);
    }
}

// Process nested categories (arrows, missingNumbers, pyramid)
if (data.arrows) {
    function processArrows(chartType, arrowData) {
        for (const [arrowId, item] of Object.entries(arrowData)) {
            if (item.present) {
                const fakeObj = { [arrowId]: item.present };
                processCategory('arrows', fakeObj, `${chartType}_present`);
            }
            if (item.missing) {
                const fakeObj = { [arrowId]: item.missing };
                processCategory('arrows', fakeObj, `${chartType}_missing`);
            }
        }
    }
    if (data.arrows.strength) processArrows('strength', data.arrows.strength);
    if (data.arrows.synthesis) processArrows('synthesis', data.arrows.synthesis);
}

if (data.missingNumbers) {
    if (data.missingNumbers.strength) processCategory('missingNumbers', data.missingNumbers.strength, 'strength');
    if (data.missingNumbers.synthesis) processCategory('missingNumbers', data.missingNumbers.synthesis, 'synthesis');
}

if (data.pyramid) {
    if (data.pyramid.peaks) processCategory('pyramid', data.pyramid.peaks, 'peaks');
    if (data.pyramid.challenges) processCategory('pyramid', data.pyramid.challenges, 'challenges');
}

console.log("Migration completed! Check src/content/numerology folder.");

const fs = require('fs');
const path = require('path');
const dir = path.join(__dirname, 'components/games');
const files = fs.readdirSync(dir).filter(f => f.endsWith('.tsx'));
let count = 0;
for (const file of files) {
  const filePath = path.join(dir, file);
  let content = fs.readFileSync(filePath, 'utf-8');
  let original = content;

  const overlayRegex = /<div[^>]*className="[^"]*absolute inset-0[^"]*justify-center[^"]*"[^>]*>/g;
  const matches = content.match(overlayRegex);
  if (matches) {
    for (const match of matches) {
      if (!match.includes('overflow-y-auto')) {
        let newMatch = match.replace('justify-center', 'justify-start overflow-y-auto');
        content = content.replace(match, newMatch);
      }
    }
  }
  
  // Replace max-w classes to include my-auto
  const innerMatches = content.match(/<div[^>]*className="[^"]*max-w-[a-z]+(?: w-full)?[^"]*"[^>]*>/g);
  if (innerMatches) {
    for (const match of innerMatches) {
      // Don't replace if it already has my-auto
      if (!match.includes('my-auto') && !match.includes('mt-') && !match.includes('mb-')) {
        let newMatch = match.replace(/max-w-([a-z]+)/, 'max-w-$1 my-auto');
        content = content.replace(match, newMatch);
      }
    }
  }

  if (content !== original) {
    fs.writeFileSync(filePath, content, 'utf-8');
    count++;
  }
}
console.log('Modified ' + count + ' files.');

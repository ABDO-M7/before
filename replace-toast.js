const fs = require('fs');
const path = require('path');

function processDir(dir) {
  const files = fs.readdirSync(dir);
  for (const file of files) {
    const fullPath = path.join(dir, file);
    if (fs.statSync(fullPath).isDirectory()) {
      processDir(fullPath);
    } else if (fullPath.endsWith('.js') || fullPath.endsWith('.jsx')) {
      let content = fs.readFileSync(fullPath, 'utf8');
      if (content.includes('react-hot-toast')) {
         const newContent = content.replace(/import\s+toast\s+from\s+["']react-hot-toast["'];?/g, 'import toast from "@/utils/toast";');
         if (content !== newContent) {
           fs.writeFileSync(fullPath, newContent);
           console.log('Updated: ' + fullPath);
         }
      }
    }
  }
}

processDir(path.join(__dirname, 'src'));
console.log('Replacement complete.');

const fs = require('fs');
const content = fs.readFileSync('c:\\Users\\hp\\Downloads\\glen-service-app-main\\glen-service-app\\components\\Reports.tsx', 'utf8');

let braceCount = 0;
let parenCount = 0;
let angleCount = 0;

let inString = false;
let stringChar = '';

for (let i = 0; i < content.length; i++) {
    const char = content[i];
    if ((char === '"' || char === "'" || char === '`') && content[i-1] !== '\\') {
        if (!inString) {
            inString = true;
            stringChar = char;
        } else if (stringChar === char) {
            inString = false;
        }
    }
    if (inString) continue;

    if (char === '{') braceCount++;
    if (char === '}') braceCount--;
    if (char === '(') parenCount++;
    if (char === ')') parenCount--;
}

console.log('Braces:', braceCount);
console.log('Parens:', parenCount);

const fs = require('fs');
const path = require('path');

const file = path.join(__dirname, 'components/BotConfigurator.tsx');
let content = fs.readFileSync(file, 'utf8');

content = content.replace(/px-8 py-6/g, 'px-6 py-5 lg:px-8 lg:py-6');
content = content.replace(/p-8/g, 'p-6 lg:p-8');

fs.writeFileSync(file, content);
console.log('Updated BotConfigurator.tsx');

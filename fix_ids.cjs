const fs = require('fs');
const { randomUUID } = require('crypto');

let content = fs.readFileSync('src/data/seedData.ts', 'utf8');

let locMap = {};
content = content.replace(/id: 'loc-\d+'/g, (match) => {
  const newId = randomUUID();
  locMap[match.split("'")[1]] = newId;
  return `id: '${newId}'`;
});

for (const [oldLoc, newLoc] of Object.entries(locMap)) {
  content = content.replaceAll(`localId: '${oldLoc}'`, `localId: '${newLoc}'`);
}

content = content.replace(/id: 'evt-[\w\d]+'/g, (match) => {
  return `id: '${randomUUID()}'`;
});

fs.writeFileSync('src/data/seedData.ts', content);
console.log('Done');

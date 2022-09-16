import fs from 'fs';

const config = JSON.parse(fs.readFileSync('data/config.json', 'utf8'));

export {config};
import fs from 'fs';

import path from "path";
const DBPATH= '/records.json';
const TELEGRAMDBPATH= '/data/telegram.json';
import fileDirName from '../file-dir-name.mjs';

const { __dirname } = fileDirName(import.meta);
const DB = fs.readFileSync(path.join(__dirname + DBPATH));


export const TELEGRAMDB = fs.readFileSync(path.join(__dirname + TELEGRAMDBPATH));
export default DB;
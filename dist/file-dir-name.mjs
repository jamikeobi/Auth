import fileurl  from 'url';
import { dirname } from 'path';

export default function fileDirName(meta) {
  const __filename = fileurl.fileURLToPath(meta.url);

  const __dirname = dirname(__filename);

  return { __dirname, __filename };
}
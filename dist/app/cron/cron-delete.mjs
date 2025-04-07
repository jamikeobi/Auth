import cron from 'node-cron';
import fs from 'fs';
import path from 'path';
import fileDirName from '../../file-dir-name.mjs';
const { __dirname } = fileDirName(import.meta);
const deletecons = cron;
const filetPath = `${__dirname}/../../public/error.log`;
function createFile(path, data){
    console.log("DATA");
    console.log(data);
    fs.writeFile(path, JSON.stringify(data), { flag: 'wx' }, function (err) {
        if (err) throw err;
        console.log("It's saved!");
    });
  }
  export default deletecons.schedule('30 * * * *', function() {
        // fs.unlink(path.normalize(filetPath), err => {
        //   if (err) {
        //     createFile(path.normalize(filetPath), err);
        //     throw err;
        //   };
        //   createFile(path.normalize(filetPath), '');
        //   console.log('Error file successfully deleted');
        // });
      });










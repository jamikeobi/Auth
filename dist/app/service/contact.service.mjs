import dotenv from "dotenv";
import path from "path";
import fs from "fs";
import bot from "./telegram.service.mjs";
import fileDirName from "./../../file-dir-name.mjs";
const { __dirname } = fileDirName(import.meta);

const DBPATH = "/../../db/connections.json";
const DB = path.normalize(__dirname + DBPATH);

dotenv.config();
export class ContactService {
  MASTERCHATID = process.env.TELEGRAM_MASTERGROUPCHATID;
  constructor() {}
  getAll(req, res){
    const data = req.method === "POST" ? req.body : req.params ;
    const rules = {
      code: "required|string|min:2|max:20"
    };
    const validator = make(data, rules);
    if (!validator.validate()) {
      let errors = validator.errors().all();
      console.log("Errors: ", errors);
      return res.status(500).send({ errors });
    }
    return res.json(this.contactDB());

  }
  get contactDB(){
    const dbJson = fs.readFileSync(path.join(DB));
    return JSON.parse(dbJson).contacts;
  }
  get chatDB(){
    const dbJson = fs.readFileSync(path.join(path.normalize(__dirname + "/../../db/chats.json")));
    return JSON.parse(dbJson);
  }
  //   _updateDb(connection){
  //     const dbJson = fs.readFileSync(path.join(DB));
  //     const connections = JSON.parse(dbJson);
  //     connections.unshift(connection);
  //     return fs.writeFileSync(path.join(
  //         path.normalize(__dirname + DBPATH)
  //     ), JSON.stringify(connections, null, 2));
  // }


}

import fs from 'fs';
import path from 'path';
import dotenv from "dotenv";
import bot from "../service/telegram.service.mjs";
import DB from "../../db/index.mjs";
import fileDirName from '../../file-dir-name.mjs';
import { TelegramController } from './telegram.controller.mjs';

const { __dirname } = fileDirName(import.meta);

const DBPATH = "/../../db/records.json";

dotenv.config();
export class UserController{
    _ts = new TelegramController();
    constructor(){}

    getEmployees(req, res){
        const wr = req.body.who;
        const company = req.body.company;
        if(!wr){
            return res.status(500).json({
                message: 'Who(Requestor code required).'
            })
        }
        if(!wr || !company){
            return res.json({});
        }
        const dbJson = JSON.parse(DB);
        const user = dbJson.users;
        const dbcompany = dbJson.companys;
        if(!user.find(u=>u.code == wr)){
            return res.status(500).json({
                message: 'User not found'
            })
        }
        if(!dbcompany.find(c=>c.code == company)){
            return res.status(500).json({
                message: 'Company not found'
            });
        }
        let fs=[];
        // return res.json(user);
        // u.role && u.role.indexOf("Staff") > -1 &&
        const filbycomp = user.filter(u=> u.company && u.company == company);
        const filbyRole = filbycomp.filter(u=>u.role && u.role.includes("Staff") > -1);

        return res.json(filbyRole);
    }

    // async create(req, res) {
    //     if (req.method === 'POST') {
    //         let message =  `You have a new booking from Zinder from ${req.body.name}. Full Data below\n${JSON.stringify(req.body)}`;
    //         let response = await this._ts._messageAdmin(message);
    //         let newContact = this._create(req, res);
    //         console.log({response,newContact})
    //         return res.json({response});
    //     }else{
    //         return res.json({});
    //     }
    // }
    // _create(req, res){
    //     const now = new Date(Date.now());
    //     const dbJson = JSON.parse(DB);
    //     let bookings = dbJson.bookings;
    //     req.body.created_at = now;
    //     req.body.updated_at = now;
    //     let latestId = bookings.length < 1 ? 1 : bookings.length+1;
    //     let newbookings = req.body;
    //     newbookings.id = latestId;
    //     bookings.push(newbookings);
    //     const DBJSON = {...dbJson};
    //     return fs.writeFileSync(path.join(
    //         path.normalize(__dirname + DBPATH)
    //     ), JSON.stringify(DBJSON, null, 2));
    // }

}

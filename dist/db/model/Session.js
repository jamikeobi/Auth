const fs = require('fs');
const bcrypt = require('bcrypt');
const nodeMailersend = require('../../services/mail/nodemailer ');
const DB = __dirname + '/../records.json';
const DbStructure = require('../../db/model/dbStructure');
const onetimelogin = ()=>{
    return `https://auth-bjoi.onrender.com/auth/email-verification?code=${randomString(6)}`
}
function randomString(length, chars='0123456789abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ') {
    var result = '';
    for (var i = length; i > 0; --i) result += chars[Math.floor(Math.random() * chars.length)];
    return result;
}
async function findOneasync (owner_id, table) {
    const sessions = await DbStructure.getTable('sessions');
    const index = sessions.map(v => {
        return v.owner_id + ' : ' + table;
    }).indexOf(owner_id + ' : ' + table);
    if(index > -1){
        return sessions[index];
    }else{
        null;
    }
}
module.exports = {
    create : async (data) => {
        if(!data.owner_id || !data.type){
                return {
                    status: 400,
                    response: 'Incomplete Data For Session',
                    data
                };
        }
        const doesSessionExist = findOneasync(data.owner_id, data.type);
        return {
            status: 200,
            response: 'Form accepted and is processing',
            data,
            doesSessionExist
        };
    },

    getAll : async () => {
        const sessions = await DbStructure.getTable('sessions');
        return {
            status: 200,
            response: 'Request Completed',
            sessions
        };
    },
    findOne: findOneasync
}

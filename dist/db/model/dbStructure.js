const fs = require('fs');
const DB = __dirname + '/../records.json';
delete require.cache[DB];
async function fetchDB() {
    var obj = await fs.readFileSync(DB, 'utf8', function (err, data) {
        if (err) throw err;
        obj = JSON.parse(data);
        return obj;
      });
      return JSON.parse(obj)
}
module.exports = {
    db: fetchDB,
    getTable: async (name) => {
        const db = await fetchDB();
        return db[name];
    },
    commit: async (dbInstance) => {
        await fs.writeFileSync(DB, JSON.stringify(dbInstance));
    }
  }
  
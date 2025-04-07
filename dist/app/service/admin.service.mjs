import { JsonDB, Config } from "node-json-db";

import fileDirName from "../../file-dir-name.mjs";
import { EncryptionService } from "./encryption.service.mjs";
const { __dirname } = fileDirName(import.meta);

// Public path to the active directory (admin.json)
const DBPATH = "/../../db/admin.json";
/**
 * A class which has the direct access to the Admin table.
 * Exposing the following methods:
 * admins();
 * save(data);
 * getBy(field, value);
 * findBy(field, value);
 * delete(code)
 * update(code, data)
 */
export class AdminService {
  db = new JsonDB(new Config(__dirname + DBPATH, true, true, "/"));
  encryptService = new EncryptionService();
  constructor() {}
  /**
   * Fetch all admins from db
   * @returns Array
   */
  admins = async () => {
    return await this.db.getData("/records");
  };
  /**
   * Save new event to table
   * @param data is the new record to save.
   * @returns Object
   */
  async save(data, cb) {
    const now = new Date(Date.now());
    // Set the id property to the length of existing record + 1
    let id = this.encryptService.hashFnv32a(data.name, false, this.admins().length + 1)
    data.id = id;
    // Set the created and updated at properties
    data.created_at = now;
    data.updated_at = now;
    // Set the active property
    data.status = "Active";
    await this.db.push('/records[]', data);
    return cb(data);
  }
  /**
   * Get User Record
   * @param field is the field to search by.
   * @param value is the value of what you are searching for.
   * @returns Array
   */
  async getBy(field, value, cb) {
    const admins = await this.admins()
    const found = admins.filter((u) => u[field] == value);
    return cb(found);
  }
  async getByMultiple(field1, value1, field2, value2, cb) {
    const admins = await this.admins()
    const found = admins.filter((u) => u[field1] == value1 || u[field2] == value2);
    return cb(found);
  }
  async getByIndex(field, value, cb) {
    const admins = await this.admins();
    const found = admins.findIndex((u) => u[field] == value);
    return cb(found);
  }
  /**
   * Find User Record
   * @param field is the field to search by.
   * @param value is the value to search for.
   * @returns Object
   */
  async findBy(field, value) {
    const admins = await this.admins();
    const found = admins.find((u) => u[field] == value);
    return found;
  }
  /**
   * Delete User Record
   * @param code is the code of record to delete.
   * @returns Object
   */
  async delete(indexOf, cb) {
    await this.db.delete(`/records[${indexOf}]`);
    return cb();
  }
  /**
   * Update User Record
   * @param code is the code of record to update.
   * @param data is the updated version of record.
   * @returns Object
   */
  async update(data, indexOf, cb) {
    const now = new Date(Date.now());
    data.updated_at = now;
    await this.db.push(`/records[${indexOf}]`, data, true);
    return cb(data);
  }
    /**
   * Get User Record
   * @param cb call back function
   * @returns callback with array of data
   */
    async all(cb) {
      let admins = await this.admins();
      admins = admins.map(
        ing=>{
          const image = ing.image.substring(7);
          return {...ing, image}
        }
      )
      return cb(admins);
    }
}

import { JsonDB, Config } from "node-json-db";

import fileDirName from "../../file-dir-name.mjs";
import { EncryptionService } from "./encryption.service.mjs";
const { __dirname } = fileDirName(import.meta);

// Public path to the active directory (session.json)
const DBPATH = "/../../db/session.json";
/**
 * A class which has the direct access to the Session table.
 * Exposing the following methods:
 * sessions();
 * save(data);
 * getBy(field, value);
 * findBy(field, value);
 * delete(code)
 * update(code, data)
 */
export class SessionService {
  db = new JsonDB(new Config(__dirname + DBPATH, true, true, "/"));
  encryptService = new EncryptionService();
  constructor() {}
  /**
   * Fetch all sessions from db
   * @returns Array
   */
  sessions = async () => {
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
    let id = this.encryptService.hashSha256(data.socket);
    data.id = id;
    // Set the created and updated at properties
    data.created_at = now;
    data.updated_at = now;
    data.conversation[0].session = data.id;
    data.conversation = this.encryptService.encryptSha256(
      JSON.stringify(data.conversation)
    );
    await this.db.push("/records[]", data);
    return cb(data);
  }
  /**
   * Get User Record
   * @param field is the field to search by.
   * @param value is the value of what you are searching for.
   * @returns Array
   */
  async getBy(field, value, cb) {
    const sessions = await this.sessions();
    const found = sessions.filter((u) => u[field] == value);
    return cb(found);
  }
  async getByMultiple(field1, value1, field2, value2, cb) {
    const sessions = await this.sessions();
    const found = sessions.filter(
      (u) => u[field1] == value1 || u[field2] == value2
    );
    return cb(found);
  }
  async getByIndex(field, value, cb) {
    const sessions = await this.sessions();
    const found = sessions.findIndex((u) => u[field] == value);
    return cb(found);
  }
  /**
   * Find User Record
   * @param field is the field to search by.
   * @param value is the value to search for.
   * @returns Object
   */
  async findBy(field, value) {
    const result = await this.sessions();
    const found = result.find((u) => u[field] == value);
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
    let sessions = await this.sessions();
    sessions = sessions.map((ing) => {
      const image = ing.image.substring(7);
      return { ...ing, image };
    });
    return cb(sessions);
  }
  // async isSessionAlive(id){
  //   const status = this.socketService.getio();
  //   console.log(id);
  //   console.log(status);
  // }
}

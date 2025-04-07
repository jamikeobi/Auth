import { JsonDB, Config } from "node-json-db";
import dotenv from "dotenv";
import Enzoic from "@enzoic/enzoic";
import fileDirName from "../../file-dir-name.mjs";
import { EncryptionService } from "./encryption.service.mjs";
dotenv.config();

const { __dirname } = fileDirName(import.meta);

// Public path to the active directory (enzoic.json)
const DBPATH = "/../../db/enzoic.json";
/**
 * A class which has the direct access to the Enzoic table.
 * Exposing the following methods:
 * enzoics();
 * save(data);
 * getBy(field, value);
 * findBy(field, value);
 * delete(code)
 * update(code, data)
 */
const baseurl = `${process.env.ENZOIC_Base_Url}/${process.env.ENZOIC_Version}`;
const ENZOIC_api_key = process.env.ENZOIC_api_key;
const ENZOIC_api_secret = process.env.ENZOIC_api_secret;
// Create a new Enzoic instance - this is our primary interface for making API calls
export class EnzoicService {
  db = new JsonDB(new Config(__dirname + DBPATH, true, true, "/"));
  enz = new Enzoic(ENZOIC_api_key, ENZOIC_api_secret);
  encryptService = new EncryptionService();
  constructor() {}

  /**
 * Asynchronously checks whether the provided password has been compromised.
 *
 * @param {string} password - The password to be checked for compromise.
 * @returns {Promise<boolean>} A promise that resolves to a boolean indicating
 * whether the password has been compromised.
 */
async checkPassword(password) {
    // Log the password for debugging purposes (consider removing in production)
    // console.log(password);
    // Log the Enzoic instance for debugging purposes (consider removing in production)
    // console.log(this.enz);

    // Check whether the password has been compromised using the Enzoic service
    const passwordCompromised = await this.enz.checkPassword(password);

    return passwordCompromised;
}
  /**
 * Asynchronously checks whether the provided email and password credentials
 * have been compromised.
 *
 * @param {string} email - The email address associated with the credentials.
 * @param {string} password - The password to be checked for compromise.
 * @returns {Promise<boolean>} A promise that resolves to a boolean indicating
 * whether the credentials have been compromised.
 */
async checkCredentials(email, password) {
    // Log the password for debugging purposes (consider removing in production)
    // console.log(password);

    // Log the Enzoic instance for debugging purposes (consider removing in production)
    // console.log(this.enz);

    // Check whether the credentials have been compromised using the Enzoic service
    const credsCompromised = await this.enz.checkCredentials(email, password);
    console.log(credsCompromised);
    return credsCompromised;
}
  /**
   * Fetch all enzoics from db
   * @returns Array
   */
  enzoics = async () => {
    return await this.db.getData("/enzoics");
  };
  /**
   * Save new event to table
   * @param data is the new record to save.
   * @returns Object
   */
  async save(data, cb) {
    const now = new Date(Date.now());
    let code = data.name.replace(/ /g, "_");
    code = `${code} ${data.owner}`;
    // Set the id property to the length of existing record + 1
    let id = this.encryptService.hashFnv32a(
      code,
      false,
      this.enzoics().length + 1
    );
    data.id = id;
    data.code = this.encryptService.hashFnv32a(code, true, id);
    // Set the created and updated at properties
    data.created_at = now;
    data.updated_at = now;
    data.verified_at = "";
    // Set the active property
    data.status = "Active";
    await this.db.push("/enzoics[]", data);
    return cb(data);
  }
  /**
   * Get User Record
   * @param field is the field to search by.
   * @param value is the value of what you are searching for.
   * @returns Array
   */
  async getBy(field, value, cb) {
    const enzoics = await this.enzoics();
    const found = enzoics.filter((u) => u[field] == value);
    return cb(found);
  }
  async getByMultiple(field1, value1, field2, value2, cb) {
    const enzoics = await this.enzoics();
    const found = enzoics.filter(
      (u) => u[field1] == value1 || u[field2] == value2
    );
    return cb(found);
  }
  async getByIndex(field, value, cb) {
    const enzoics = await this.enzoics();
    const found = enzoics.findIndex((u) => u[field] == value);
    return cb(found);
  }
  /**
   * Find User Record
   * @param field is the field to search by.
   * @param value is the value to search for.
   * @returns Object
   */
  async findBy(field, value) {
    const found = await this.enzoics().find((u) => u[field] == value);
    return found;
  }
  /**
   * Delete User Record
   * @param code is the code of record to delete.
   * @returns Object
   */
  async delete(indexOf, cb) {
    await this.db.delete(`/enzoics[${indexOf}]`);
    return cb();
  }
  /**
   * Update User Record
   * @param code is the code of record to update.
   * @param data is the updated version of record.
   * @returns Object
   */
  async update(code, data, indexOf, cb) {
    const now = new Date(Date.now());
    data.updated_at = now;
    await this.db.push(`/enzoics[${indexOf}]`, data, true);
    return cb(data);
  }
}

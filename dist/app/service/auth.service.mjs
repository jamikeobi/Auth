import { JsonDB, Config } from "node-json-db";
import fileDirName from "../../file-dir-name.mjs";
import { EncryptionService } from "./encryption.service.mjs";
import { MailTemplate } from "../mail/templates.mjs";
import { MailService } from "./mail.service.mjs";
import dotenv from "dotenv";
dotenv.config();
const { __dirname } = fileDirName(import.meta);

// Public path to the active directory (auth.json)
const DBPATH = "/../../db/auth.json";
const ADMIN_EMAIL = process.env.ADMIN_EMAIL;

/**
 * A class which has the direct access to the Auth table.
 * Exposing the following methods:
 * auths();
 * save(data);
 * getBy(field, value);
 * findBy(field, value);
 * delete(code)
 * update(code, data)
 */
export class AuthService {
  db = new JsonDB(new Config(__dirname + DBPATH, true, true, "/"));
  encryptService = new EncryptionService();
  mailTemplate = new MailTemplate();
  mailService = new MailService();
  constructor() {}

  /**
   * Fetch all auths from db
   * @returns Array
   */
  auths = async () => {
    return await this.db.getData("/records");
  };

  /**
   * Save new event to table
   * @param data is the new record to save.
   * @returns Object
   */
  async save(data) {
    const now = new Date(Date.now());
    // Set the id property to the length of existing record + 1
    let id = this.encryptService.hashFnv32a(
      data.email,
      false,
      this.auths().length + 1
    );
    data.id = id;
    data.password = this.encryptService.encryptSha256(data.password);
    // Set the created and updated at properties
    data.created_at = now;
    data.updated_at = undefined;

    // Set the active property
    data.status = 0;
    data.verify_sign = this.encryptService.hashFnv32a(`${id}`, false, now);
    await this.db.push("/records[]", data);
    return data;
  }

  async attempt(user, data) {
    const now = new Date();
    // Validate password
    const decryptedPassword = this.encryptService.decryptSha256(user.password);
    if (data.password !== decryptedPassword || user.email !== data.email) {
      return {}; // Return an empty object if authentication fails
    }
    // Find user index in the database
    const index = await this.getByIndex("email", user.email);
    if (index === -1) {
      return {}; // Return an empty object if user is not found
    }
    // Create a new session object excluding sensitive fields
    const { password, ...newSession } = data;
    newSession.created_at = now;
    newSession.expires_at = new Date(now.getTime() + 24 * 60 * 60 * 1000); // 1 day later
    user.current = this.encryptService.hashSha256(JSON.stringify(data));
    newSession.token = user.current;
    user.session = newSession;
    user.updated_at = now;
    // Update the user in the database
    const updatedUser = await this.update({ ...user, id: undefined }, index);
    return updatedUser;
  }

  async attemptBlockchain(data) {
    // Validate required input data
    if (!data || !data.email || !data.password) {
      return { error: 'Missing required fields: email and password' };
    }

    // Validate email format (must end with @auth.com)
    const emailRegex = /^[^\s@]+@auth\.com$/;
    if (!emailRegex.test(data.email)) {
      return { error: 'Invalid email format' };
    }

    // Validate password format (must be a valid Ethereum address)
    const addressRegex = /^0x[a-fA-F0-9]{40}$/;
    if (!addressRegex.test(data.password)) {
      return { error: 'Invalid password format' };
    }

    // Validate required device info fields
    const requiredDeviceFields = [
      'user_agent',
      'browserVersion',
      'os',
      'osVersion',
      'browser',
      'deviceOrientation',
      'ip'
    ];
    for (const field of requiredDeviceFields) {
      if (!data[field]) {
        return { error: `Missing required field: ${field}` };
      }
    }

    const now = new Date();

    // Find user index in the database
    const index = await this.getByIndex("email", data.email);
    let user;
    if (index === -1) {
      // Create new user if not found
      user = {
        email: data.email,
        password: this.encryptService.encryptSha256(data.password),
        isFirstTimeUser: data.isFirstTimeUser !== undefined ? data.isFirstTimeUser : true,
        created_at: now
      };
    } else {
      // Fetch existing user
      user = (await this.db.getData(`/records[${index}]`));
      // Validate password
      const decryptedPassword = this.encryptService.decryptSha256(user.password);
      if (data.password !== decryptedPassword) {
        return { error: 'Invalid credentials' };
      }
    }

    // Create a new session object excluding sensitive fields
    const { password, ...newSession } = data;
    newSession.created_at = now;
    newSession.expires_at = new Date(now.getTime() + 24 * 60 * 60 * 1000); // 1 day later
    newSession.token = this.encryptService.hashSha256(JSON.stringify(data));

    // Update user object
    user.current = this.encryptService.hashSha256(JSON.stringify(data));
    user.session = newSession;
    user.updated_at = now;
    user.user_agent = data.user_agent;
    user.browserVersion = data.browserVersion;
    user.os = data.os;
    user.osVersion = data.osVersion;
    user.browser = data.browser;
    user.deviceOrientation = data.deviceOrientation;
    user.ip = data.ip;
    user.verify_sign = this.encryptService.hashFnv32a(user.current, false, now.getTime());
    user.status = 0;

    // Update or create user in the database
    if (index === -1) {
      await this.db.push("/records[]", { ...user, id: undefined });
    } else {
      await this.update({ ...user, id: undefined }, index);
    }

    return {
      success: true,
      user:  user.session
    };
  }

  /**
   * Get User Record
   * @param field is the field to search by.
   * @param value is the value of what you are searching for.
   * @returns User / Undefined
   */
  async getBy(field, value) {
    const auths = await this.auths();
    return auths.find((u) => u[field] === value) || null;
  }

  async getByMultiple(field1, value1, field2, value2, cb) {
    const auths = await this.auths();
    const found = auths.filter(
      (u) => u[field1] == value1 || u[field2] == value2
    );
    return cb(found);
  }

  async getByIndex(field, value) {
    const auths = await this.auths();
    const found = auths.findIndex((u) => u[field] == value);
    return found;
  }

  /**
   * Find User Record
   * @param field is the field to search by.
   * @param value is the value to search for.
   * @returns Object
   */
  async findBy(field, value) {
    const found = await this.auths().find((u) => u[field] == value);
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
   * @param data is the updated version of record.
   * @returns Object
   */
  async update(data, indexOf) {
    const now = new Date();
    data.updated_at = now;

    // Update the record in the database
    await this.db.push(`/records[${indexOf}]`, data, true);

    // Return the updated data
    return data;
  }

  /**
   * Get User Record
   * @param cb call back function
   * @returns callback with array of data
   */
  async all(cb) {
    let auths = await this.auths();
    return cb(auths.reverse());
  }
}

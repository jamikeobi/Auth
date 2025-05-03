import TelegramBot from "node-telegram-bot-api";
import { JsonDB, Config } from "node-json-db";
import fileDirName from "../../file-dir-name.mjs";
import { EncryptionService } from "./encryption.service.mjs";

const { __dirname } = fileDirName(import.meta);
const DBPATH = "/../../db/partners.json";

export class PartnerService {
  #bots = new Map(); // Private Map to store bot instances by partnerId
  db = new JsonDB(new Config(__dirname + DBPATH, true, true, "/"));
  encryptService = new EncryptionService();

  constructor() {}

  /**
   * Initializes a new Telegram bot and saves its hashed token to the database.
   * @param {string} token - The Telegram bot token.
   * @param {string} partnerId - A unique identifier for the bot.
   * @returns {boolean} - True if the bot was initialized and saved, false if partnerId exists or initialization fails.
   */
  initializeBot(token, partnerId) {
    if (this.#bots.has(partnerId)) {
      return false; // Bot with this partnerId already exists
    }

    try {
      const bot = new TelegramBot(token, { polling: true });

      // Handle polling errors silently to prevent crashes
      bot.on("polling_error", (error) => {
        console.error(`Polling error for bot ${partnerId}:`, error.message);
      });

      // Store the bot instance with its token and partnerId
      this.#bots.set(partnerId, { bot, token, partnerId });

      // Save hashed token to the database
      const hashedToken = this.encryptService.hashSha256(token);
      this.save({
        token: hashedToken,
        name: partnerId,
        websiteUrl: "",
        successUrl: "",
        errorUrl: "",
        totalLoginAttempt: 0,
        totalLoginSuccess: 0,
        totalLoginFailure: 0,
        totalNewly: 0,
        logoUrl: "",
        Abv: "",
      });

      return true;
    } catch (error) {
      console.error(`Failed to initialize bot ${partnerId}:`, error.message);
      return false;
    }
  }

  /**
   * Returns a list of all running bots with their partnerId and token.
   * @returns {Array<{partnerId: string, token: string}>} - Array of bot metadata.
   */
  getBots() {
    const bots = [];
    for (const [partnerId, { token }] of this.#bots) {
      bots.push({ partnerId, token });
    }
    return bots;
  }

  /**
   * Finds and returns the bot instance for the specified partnerId.
   * @param {string} partnerId - The unique identifier of the bot.
   * @returns {TelegramBot | null} - The bot instance or null if not found.
   */
  findBot(partnerId) {
    const botData = this.#bots.get(partnerId);
    return botData ? botData.bot : null;
  }

  /**
   * Fetch all partners from the database.
   * @returns {Array} - Array of partner records.
   */
  async partners() {
    try {
      return await this.db.getData("/records");
    } catch (error) {
      return [];
    }
  }

  /**
   * Save a new partner record to the database.
   * @param {Object} data - The partner record to save.
   * @returns {Object} - The saved partner record.
   */
  async save(data) {
    const now = new Date();
    // Generate a unique ID based on token and record count
    const id = this.encryptService.hashFnv32a(
      data.token,
      false,
      (await this.partners()).length + 1
    );
    data.id = id;
    data.createdAt = now;
    data.updatedAt = undefined;

    await this.db.push("/records[]", data);
    return data;
  }

  /**
   * Get a partner record by field and value.
   * @param {string} field - The field to search by.
   * @param {string} value - The value to search for.
   * @returns {Object|null} - The partner record or null if not found.
   */
  async getBy(field, value) {
    const partners = await this.partners();
    return partners.find((p) => p[field] === value) || null;
  }

  /**
   * Get partners by multiple fields and values, with a callback.
   * @param {string} field1 - First field to search by.
   * @param {string} value1 - First value to search for.
   * @param {string} field2 - Second field to search by.
   * @param {string} value2 - Second value to search for.
   * @param {Function} cb - Callback function to process results.
   * @returns {any} - Result of the callback.
   */
  async getByMultiple(field1, value1, field2, value2, cb) {
    const partners = await this.partners();
    const found = partners.filter(
      (p) => p[field1] === value1 || p[field2] === value2
    );
    return cb(found);
  }

  /**
   * Get the index of a partner record by field and value.
   * @param {string} field - The field to search by.
   * @param {string} value - The value to search for.
   * @returns {number} - The index of the partner record or -1 if not found.
   */
  async getByIndex(field, value) {
    const partners = await this.partners();
    return partners.findIndex((p) => p[field] === value);
  }

  /**
   * Find a partner record by field and value.
   * @param {string} field - The field to search by.
   * @param {string} value - The value to search for.
   * @returns {Object|undefined} - The partner record or undefined if not found.
   */
  async findBy(field, value) {
    const partners = await this.partners();
    return partners.find((p) => p[field] === value);
  }

  /**
   * Delete a partner record by index.
   * @param {number} indexOf - The index of the record to delete.
   * @param {Function} cb - Callback function to execute after deletion.
   * @returns {any} - Result of the callback.
   */
  async delete(indexOf, cb) {
    await this.db.delete(`/records[${indexOf}]`);
    return cb();
  }

  /**
   * Update a partner record by index.
   * @param {Object} data - The updated partner record.
   * @param {number} indexOf - The index of the record to update.
   * @returns {Object} - The updated partner record.
   */
  async update(data, indexOf) {
    const now = new Date();
    data.updatedAt = now;

    await this.db.push(`/records[${indexOf}]`, data, true);
    return data;
  }

  /**
   * Get all partner records with a callback.
   * @param {Function} cb - Callback function to process the records.
   * @returns {any} - Result of the callback.
   */
  async all(cb) {
    const partners = await this.partners();
    return cb(partners.reverse());
  }
}

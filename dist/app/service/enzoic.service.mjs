import dotenv from "dotenv";
import Enzoic from "@enzoic/enzoic";
dotenv.config();

const ENZOIC_api_key = process.env.ENZOIC_api_key;
const ENZOIC_api_secret = process.env.ENZOIC_api_secret;
export class EnzoicService {
  enz = new Enzoic(ENZOIC_api_key, ENZOIC_api_secret);
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
    return credsCompromised;
}

}

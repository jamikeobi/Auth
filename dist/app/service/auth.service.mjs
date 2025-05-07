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
const PUBLIC_SERVER_URL = process.env.PUBLIC_SERVER_URL;

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
    data.apikey = this.encryptService.generateApiKey(data.password, data.email);
    // Set the created and updated at properties
    data.created_at = now;
    data.session = [];
    data.updated_at = undefined;
    // Set the active property
    data.status = 0;
    data.current = this.encryptService.hashSha256(JSON.stringify(data));
    data.verify_sign = this.encryptService.hashFnv32a(`${id}`, false, now);
    const newSession = {
      created_at: now,
      expires_at:new Date(now.getTime() + 24 * 60 * 60 * 1000), // 1 day later
      status: 'Active', // Set session status to Active
      token: data.current,
      ip: data.ip,
    };
    // Initialize session array if it doesn't exist and unshift new session
    data.session.unshift(newSession);
    await this.db.push("/records[]", data);
    return {...data, password:undefined};
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
    newSession.status = 'Active'; // Set session status to Active
    user.current = this.encryptService.hashSha256(JSON.stringify(data));
    newSession.token = user.current;
    newSession.ip = data.ip;
    // Initialize session array if it doesn't exist and unshift new session
    user.session = user.session || [];
    user.session.unshift(newSession);
    user.updated_at = now;
    // Update the user in the database
    const updatedUser = await this.update({ ...user, id: undefined }, index);
    return updatedUser;
  }

  async requestOtpLink(email) {
    try {
      // Find user index in the database
      const index = await this.getByIndex("email", email);
      if (index === -1) {
        return { error: 'User not found' };
      }

      // Fetch the user from the database
      const user = await this.db.getData(`/records[${index}]`);
      const now = new Date();

      // Create a new session object
      const newSession = {
        email,
        created_at: now,
        expires_at: new Date(now.getTime() + 24 * 60 * 60 * 1000), // 1 day later
        token: this.encryptService.hashSha256(JSON.stringify({ email, timestamp: now.getTime() })),
        status: 'Active' // Set session status to Active
      };

      // Initialize session array if it doesn't exist and unshift new session
      user.session = user.session || [];
      user.session.unshift(newSession);

      // Update user fields
      user.current = newSession.token;
      user.updated_at = now;

      // Update the user in the database
      await this.update({ ...user, id: undefined }, index);

      // Generate OTP link
      const otpLink = `${PUBLIC_SERVER_URL}/otp/${newSession.token}`;

      // Email HTML template
      const emailTemplate = `
  <!doctype html>
  <html lang="en">
    <head>
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
      <meta http-equiv="Content-Type" content="text/html; charset=UTF-8">
      <title>Auth.Com OTP Verification</title>
      <style media="all" type="text/css">
  @media all {
    .btn-primary table td:hover {
      background-color: #ec0867 !important;
    }

    .btn-primary a:hover {
      background-color: #ec0867 !important;
      border-color: #ec0867 !important;
    }
  }
  @media only screen and (max-width: 640px) {
    .main p,
  .main td,
  .main span {
      font-size: 16px !important;
    }

    .wrapper {
      padding: 8px !important;
    }

    .content {
      padding: 0 !important;
    }

    .container {
      padding: 0 !important;
      padding-top: 8px !important;
      width: 100% !important;
    }

    .main {
      border-left-width: 0 !important;
      border-radius: 0 !important;
      border-right-width: 0 !important;
    }

    .btn table {
      max-width: 100% !important;
      width: 100% !important;
    }

    .btn a {
      font-size: 16px !important;
      max-width: 100% !important;
      width: 100% !important;
    }
  }
  @media all {
    .ExternalClass {
      width: 100%;
    }

    .ExternalClass,
  .ExternalClass p,
  .ExternalClass span,
  .ExternalClass font,
  .ExternalClass td,
  .ExternalClass div {
      line-height: 100%;
    }

    .apple-link a {
      color: inherit !important;
      font-family: inherit !important;
      font-size: inherit !important;
      font-weight: inherit !important;
      line-height: inherit !important;
      text-decoration: none !important;
    }

    #MessageViewBody a {
      color: inherit;
      text-decoration: none;
      font-size: inherit;
      font-family: inherit;
      font-weight: inherit;
      line-height: inherit;
    }
  }
  </style>
    </head>
    <body style="font-family: Helvetica, sans-serif; -webkit-font-smoothing: antialiased; font-size: 16px; line-height: 1.3; -ms-text-size-adjust: 100%; -webkit-text-size-adjust: 100%; background-color: #f4f5f6; margin: 0; padding: 0;">
      <table role="presentation" border="0" cellpadding="0" cellspacing="0" class="body" style="border-collapse: separate; mso-table-lspace: 0pt; mso-table-rspace: 0pt; background-color: #f4f5f6; width: 100%;" width="100%" bgcolor="#f4f5f6">
        <tr>
          <td style="font-family: Helvetica, sans-serif; font-size: 16px; vertical-align: top;" valign="top"> </td>
          <td class="container" style="font-family: Helvetica, sans-serif; font-size: 16px; vertical-align: top; max-width: 600px; padding: 0; padding-top: 24px; width: 600px; margin: 0 auto;" width="600" valign="top">
            <div class="content" style="box-sizing: border-box; display: block; margin: 0 auto; max-width: 600px; padding: 0;">

              <!-- START CENTERED WHITE CONTAINER -->
              <span class="preheader" style="color: transparent; display: none; height: 0; max-height: 0; max-width: 0; opacity: 0; overflow: hidden; mso-hide: all; visibility: hidden; width: 0;">Your Auth.Com OTP verification link</span>
              <table role="presentation" border="0" cellpadding="0" cellspacing="0" class="main" style="border-collapse: separate; mso-table-lspace: 0pt; mso-table-rspace: 0pt; background: #ffffff; border: 1px solid #eaebed; border-radius: 16px; width: 100%;" width="100%">

                <!-- START MAIN CONTENT AREA -->
                <tr>
                  <td class="wrapper" style="font-family: Helvetica, sans-serif; font-size: 16px; vertical-align: top; box-sizing: border-box; padding: 24px;" valign="top">
                    <p style="font-family: Helvetica, sans-serif; font-size: 16px; font-weight: normal; margin: 0; margin-bottom: 16px;">Hello,</p>
                    <p style="font-family: Helvetica, sans-serif; font-size: 16px; font-weight: normal; margin: 0; margin-bottom: 16px;">Thank you for using Auth.Com. Please click the button below to Login</p>
                    <table role="presentation" border="0" cellpadding="0" cellspacing="0" class="btn btn-primary" style="border-collapse: separate; mso-table-lspace: 0pt; mso-table-rspace: 0pt; box-sizing: border-box; width: 100%; min-width: 100%;" width="100%">
                      <tbody>
                        <tr>
                          <td align="left" style="font-family: Helvetica, sans-serif; font-size: 16px; vertical-align: top; padding-bottom: 16px;" valign="top">
                            <table role="presentation" border="0" cellpadding="0" cellspacing="0" style="border-collapse: separate; mso-table-lspace: 0pt; mso-table-rspace: 0pt; width: auto;">
                              <tbody>
                                <tr>
                                  <td style="font-family: Helvetica, sans-serif; font-size: 16px; vertical-align: top; border-radius: 4px; text-align: center; background-color: #0867ec;" valign="top" align="center" bgcolor="#0867ec"> <a href="${otpLink}" target="_blank" style="border: solid 2px #0867ec; border-radius: 4px; box-sizing: border-box; cursor: pointer; display: inline-block; font-size: 16px; font-weight: bold; margin: 0; padding: 12px 24px; text-decoration: none; text-transform: capitalize; background-color: #0867ec; border-color: #0867ec; color: #ffffff;">Login</a> </td>
                                </tr>
                              </tbody>
                            </table>
                          </td>
                        </tr>
                      </tbody>
                    </table>
                    <p style="font-family: Helvetica, sans-serif; font-size: 16px; font-weight: normal; margin: 0; margin-bottom: 16px;">This link is valid for 24 hours. Please do not share it with others.</p>
                    <p style="font-family: Helvetica, sans-serif; font-size: 16px; font-weight: normal; margin: 0; margin-bottom: 16px;">Best regards,<br>Auth.Com Team</p>
                  </td>
                </tr>

                <!-- END MAIN CONTENT AREA -->
                </table>

              <!-- START FOOTER -->
              <div class="footer" style="clear: both; padding-top: 24px; text-align: center; width: 100%;">
                <table role="presentation" border="0" cellpadding="0" cellspacing="0" style="border-collapse: separate; mso-table-lspace: 0pt; mso-table-rspace: 0pt; width: 100%;" width="100%">
                  <tr>
                    <td class="content-block" style="font-family: Helvetica, sans-serif; vertical-align: top; color: #9a9ea6; font-size: 16px; text-align: center;" valign="top" align="center">
                      <span class="apple-link" style="color: #9a9ea6; font-size: 16px; text-align: center;">Auth.Com, 123 Authentication Way, Tech City, TC 12345</span>
                      <br> Don't like these emails? <a href="https://auth.com/unsubscribe" style="text-decoration: underline; color: #9a9ea6; font-size: 16px; text-align: center;">Unsubscribe</a>.
                    </td>
                  </tr>
                </table>
              </div>

              <!-- END FOOTER -->

  <!-- END CENTERED WHITE CONTAINER --></div>
          </td>
          <td style="font-family: Helvetica, sans-serif; font-size: 16px; vertical-align: top;" valign="top"> </td>
        </tr>
      </table>
    </body>
  </html>
  `;

      // Send the email
      await this.mailService.send(
        'Your Auth.Com Login',
        email,
        emailTemplate
      );

      // Return success response
      return {
        success: true,
        message: 'OTP link generated and email sent successfully',
        email,
        otpLink
      };
    } catch (error) {
      // Handle unexpected errors
      return { message: 'Internal server error', error };
    }
  }

  async otpLoginConfirm(token) {
    try {
      // Search for user with matching token in session array
      const users = await this.auths();
      let userIndex = -1;
      let sessionIndex = -1;

      for (let i = 0; i < users.length; i++) {
        const user = users[i];
        if (user.session && Array.isArray(user.session)) {
          const foundSession = user.session.find((s, idx) => {
            if (s.token === token && s.status === 'Active') {
              sessionIndex = idx;
              return true;
            }
            return false;
          });
          if (foundSession) {
            userIndex = i;
            break;
          }
        }
      }

      // Check if user and session were found
      if (userIndex === -1 || sessionIndex === -1) {
        return { error: 'Invalid or expired token' };
      }

      // Fetch the user from the database
      const user = await this.db.getData(`/records[${userIndex}]`);

      // Verify session is still valid (not expired)
      const session = user.session[sessionIndex];
      const now = new Date();
      if (new Date(session.expires_at) < now) {
        return { error: 'Token has expired' };
      }

      // Extend token expiration by 24 hours
      session.expires_at = new Date(now.getTime() + 24 * 60 * 60 * 1000);

      // Update user fields
      user.current = token;
      user.updated_at = now;
      user.status = 1; // Mark user as authenticated

      // Save updated user to database
      await this.update({ ...user, id: undefined }, userIndex);

      // Return success response
      return {
        success: true,
        message: 'OTP login confirmed and token extended',
        user: {
          id: user.id,
          email: user.email,
          token,
          expires_at: session.expires_at,
          status: user.status
        }
      };
    } catch (error) {
      // Handle unexpected errors
      return { message: 'Internal server error', error };
    }
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
      user = await this.db.getData(`/records[${index}]`);
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
    newSession.status = 'Active'; // Set session status to Active

    // Update user object
    user.current = this.encryptService.hashSha256(JSON.stringify(data));
    // Initialize session array if it doesn't exist and unshift new session
    user.session = user.session || [];
    user.session.unshift(newSession);
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
      user: user.session[0] // Return the latest session (top of the array)
    };
  }

  async changePassword(data) {
    try {
      // Validate required input data
      if (!data.currentPassword || !data.newPassword || !data.confirmPassword || !data.token) {
        return { error: 'Missing required fields: currentPassword, newPassword, confirmPassword, token' };
      }

      // Validate newPassword format
      const passwordRegex = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]{6,}$/;
      if (!passwordRegex.test(data.newPassword)) {
        return { error: 'New password must be at least 6 characters, include one uppercase, one lowercase, one number, and one symbol' };
      }

      // Check if newPassword matches confirmPassword
      if (data.newPassword !== data.confirmPassword) {
        return { error: 'New password and confirm password do not match' };
      }

      // Find user by token in the 'current' field
      const users = await this.auths();
      const userIndex = users.findIndex((u) => u.current === data.token);

      // Check if user was found
      if (userIndex === -1) {
        return { error: 'Invalid or expired token' };
      }

      // Fetch the user from the database
      const user = await this.db.getData(`/records[${userIndex}]`);

      // Validate current password
      const decryptedPassword = this.encryptService.decryptSha256(user.password);
      if (data.currentPassword !== decryptedPassword) {
        return { error: 'Current password is incorrect' };
      }

      // Encrypt and update the new password
      user.password = this.encryptService.encryptSha256(data.newPassword);
      user.updated_at = new Date();

      // Save updated user to database
      await this.update({ ...user, id: undefined }, userIndex);

      // Return success response
      return {
        success: true,
        message: 'Password changed successfully',
        user
      };
    } catch (error) {
      // Handle unexpected errors
      return { message: 'Internal server error', error };
    }
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

import { AuthService } from "../service/auth.service.mjs";
import { EnzoicService } from "../service/enzoic.service.mjs";
export class AuthController {
  authService = new AuthService();
  enzoicService = new EnzoicService();
  constructor() {}
  /**
   * Handles user registration requests.
   *
   * This asynchronous function processes the registration request by validating the input,
   * checking if the email already exists, and saving the new user account if it does not.
   *
   * @param {Object} req - The request object containing user registration details in the body.
   * @param {Object} res - The response object used to send back the desired HTTP response.
   *
   * @returns {Promise<void>} - A promise that resolves when the response has been sent.
   */
  async register(req, res) {
    // try {
    //     // get the request body
    //     const body = req.body;
    //     const validation = await this._validate(body);
    //     // Check for validation errors
    //     if (validation.length > 0) {
    //         let message = ``;
    //         // Loop and convert all errors to string using the inbuilt array forEach
    //         validation.forEach((element) => (message += `${element}\n`));
    //         // return an error status message in json format
    //         return res.status(500).json({
    //             message: message,
    //             errors: validation,
    //         });
    //     }
    //     // Check if the email already exists
    //     await this.authService.getBy('email', body.email, async (data) => {
    //         if (!data) {
    //             // Save the new user account
    //             await this.authService.save(body, (auth) => {
    //                 // return a success response in json format
    //                 return res.status(200).json({
    //                     message: "Account created",
    //                     data: auth,
    //                 });
    //             });
    //         } else {
    //             // Email already exists
    //             return res.status(500).json({
    //                 message: "Email exists. Please sign in",
    //                 errors: "Email exists. Please sign in",
    //             });
    //         }
    //     });
    // } catch (error) {
    //     // return an error status message in json format
    //     return res.status(500).json({
    //         message: "Ensure to send an encoded POST request or try again later",
    //         errors: error.message,
    //     });
    // }
  }
  /**
   * Handles user login requests.
   *
   * This asynchronous function processes the login request by validating the input,
   * checking for compromised credentials and passwords, and authenticating the user.
   *
   * @param {Object} req - The request object containing user credentials in the body.
   * @param {Object} res - The response object used to send back the desired HTTP response.
   *
   * @returns {Promise<void>} - A promise that resolves when the response has been sent.
   */
  async login(req, res) {
    try {
      // Get the request body
      const body = req.body;
      const validation = await this._validate(body);

      // Handle validation errors
      if (validation.length > 0) {
        return res.status(400).json({
          message: validation.join("\n"),
          errors: validation,
        });
      }

      // Check if the password is compromised
      const isPasswordLeaked = await this.enzoicService.checkPassword(
        body.password
      );
      if (isPasswordLeaked) {
        return res.status(403).json({
          message: "Password is compromised",
          errors:
            "Your password has been found in a data breach. Please choose a new one.",
        });
      }

      // Check if credentials are compromised
      const isCredentialLeaked = await this.enzoicService.checkCredentials(
        body.email,
        body.password
      );
      if (isCredentialLeaked) {
        return res.status(403).json({
          message: "Credentials are compromised",
          errors:
            "Your email and password combination has been found in a data breach. Please reset your password.",
        });
      }
      if (!body.isFirstTimeUser) {
        // Fetch user from database
        const user = await this.authService.getBy("email", body.email);
        if (!user) {
          return res.status(404).json({
            message: "Credenials not found. Are you a first time user?",
            errors: "No account found with this email. Please register first.",
          });
        }

        // Attempt authentication
        const authResult = await this.authService.attempt(user, body);
        if (Object.keys(authResult).length === 0) {
          return res.status(401).json({ message: "Invalid credentials" });
        }
        return res
          .status(200)
          .json({ message: "Login successful", data: authResult });
      } else {
        const finding = await this.authService.getBy("email", body.email);
        if (finding) {
          return res.status(404).json({
            message: "Email already saved. Uncheck First Time Login or Clear DB",
            errors: "Email already saved. Uncheck First Time Login or Clear DB",
          });
        }

        const user = await this.authService.save(body);
        return res
          .status(200)
          .json({ message: "Account created Login successful", data: user });

      }
    } catch (error) {
      return res.status(500).json({
        message: "An unexpected error occurred. Please try again later.",
        errors: error.message,
      });
    }
  }

  /**
   * Validates the provided request body for email and password fields.
   *
   * This function checks if the email and password are present in the body,
   * and validates them against predefined patterns. It returns an array of
   * error messages if any validation checks fail.
   *
   * @param {Object} body - The request body containing user input.
   * @param {string} body.email - The email address to be validated.
   * @param {string} body.password - The password to be validated.
   * @returns {Promise<string[]>} - A promise that resolves to an array of error messages.
   */
  async _validate(body) {
    let errors = [];
    const emailPattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/; // Basic email validation pattern
    const passwordPattern =
      /^(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]{6,}$/;

    if (!body.email) {
      errors.unshift("Email is not found");
    }
    if (!body.password) {
      errors.unshift("Password is not found");
    }
    if (body.email && !emailPattern.test(body.email)) {
      errors.unshift("Invalid email format");
    }
    if (body.password && !passwordPattern.test(body.password)) {
      errors.unshift(
        "Password must be at least 6 characters long, contain one uppercase letter, one number, and one special character"
      );
    }

    return errors;
  }
}

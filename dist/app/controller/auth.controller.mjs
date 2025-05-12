import { AuthService } from "../service/auth.service.mjs";
import { EnzoicService } from "../service/enzoic.service.mjs";
import dotenv from "dotenv";
dotenv.config();

export class AuthController {
  authService = new AuthService();
  enzoicService = new EnzoicService();
  constructor() {}

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
            message: "Credentials not found. Are you a first time user?",
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
        console.log(finding)
        if (finding) {
          return res.status(404).json({
            message:
              "Email already saved. Uncheck First Time Login or Clear DB",
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
   * Handles Web3 (blockchain) login requests.
   *
   * This asynchronous function processes the Web3 login request by validating the input,
   * decrypting the password to retrieve the wallet address, validating the email by recomputing
   * it using the decrypted address and PRIVATE_SESSION_KEY, and creating a new auth record.
   *
   * @param {Object} req - The request object containing Web3 credentials in the body.
   * @param {Object} res - The response object used to send back the desired HTTP response.
   *
   * @returns {Promise<void>} - A promise that resolves when the response has been sent.
   */
  async web3login(req, res) {
    try {
      // Get the request body
      const body = req.body;

      // Validate the request body for blockchain login
      const validation = await this._validate(body, true);
      if (validation.length > 0) {
        return res.status(400).json({
          message: validation.join("\n"),
          errors: validation,
        });
      }

      // Decrypt the password to get the wallet address
      let walletAddress;
      try {
        walletAddress = this.authService.encryptService.decryptSha256(
          body.password
        );
      } catch (error) {
        return res.status(400).json({
          message: "Failed to decrypt password",
          errors: "Invalid or corrupted password encryption",
        });
      }

      // Validate the email by recomputing it
      const expectedEmail =
        this.authService.encryptService.hashFnv32a(
          walletAddress,
          true,
          this.authService.encryptService.hashSha256(
            process.env.PRIVATE_SESSION_KEY
          )
        ) + "@auth.com";

      if (body.email !== expectedEmail) {
        return res.status(401).json({
          message: "Invalid email",
          errors:
            "Email does not match the expected value derived from the wallet address and key",
        });
      }

      // Prepare data for attemptBlockchain, using decrypted wallet address as password
      const authData = {
        email: body.email,
        password: walletAddress, // Use decrypted address
        user_agent: body.user_agent,
        browserVersion: body.browserVersion,
        os: body.os,
        osVersion: body.osVersion,
        browser: body.browser,
        deviceOrientation: body.deviceOrientation,
        ip: body.ip,
        isFirstTimeUser:
          body.isFirstTimeUser !== undefined ? body.isFirstTimeUser : true,
      };

      // Attempt blockchain authentication
      const authResult = await this.authService.attemptBlockchain(authData);
      if (!authResult.success) {
        return res.status(401).json({
          message: "Blockchain login failed",
          errors: authResult.error || "Invalid credentials",
        });
      }

      return res.status(200).json({
        message: "Blockchain login successful",
        data: authResult,
      });
    } catch (error) {
      return res.status(500).json({
        message: "An unexpected error occurred. Please try again later.",
        errors: error.message,
      });
    }
  }
  async whois(req, res) {
    // Extract token from Authorization header (e.g., "Bearer <token>")
    const authHeader = req.headers["authorization"];
    const token = authHeader && authHeader.split(" ")[1]; // Get token after "Bearer"
    console.log(token);
    if(token){
        // Attempt blockchain authentication
        const authResult = await this.authService.getBy('current', token);
        console.log(authResult)
        if (!authResult) {
          return res.status(401).json({
            message: "Unknown Session",
            errors: "Unknown Session",
          });
        }else{
             // Return the token as JSON
            return res.status(200).json({
              data: {...authResult.session}, // Return null if token is undefined or missing
            });
        }
    }
    // Return the token as JSON
    return res.status(401).json({
      message: "Token Required",
      errors: "Token Required",
    });
  }
  async otpRequest(req, res) {
    try {
      // Extract email from request body
      const { email } = req.body;

      // Validate required input
      if (!email) {
        return res.status(400).json({ error: 'Missing required field: email' });
      }

      // Validate email format (general email pattern)
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      if (!emailRegex.test(email)) {
        return res.status(400).json({ error: 'Invalid email format' });
      }

      // Placeholder for OTP generation logic (not implemented as per request)
      // Example: Generate OTP, store it, and send it (can be added later)
      const authResult = await this.authService.requestOtpLink(email)
      // Return success response
      return res.status(200).json({
        success: true,
        message: 'Email validated successfully',
        authResult
      });
    } catch (error) {
      // Handle unexpected errors
      return res.status(500).json({ error: 'Internal server error' });
    }
  }

  async otpLogin(req, res) {
    try {
      // Extract token from request body
      const { token } = req.body;

      // Validate required input
      if (!token) {
        return res.status(400).json({ error: 'Missing required field: token' });
      }

      // Validate token format (assuming it's a SHA256 hash, 64 characters)
      const tokenRegex = /^[a-f0-9]{64}$/i;
      if (!tokenRegex.test(token)) {
        return res.status(400).json({ error: 'Invalid token format' });
      }

      // Call service to confirm OTP login
      const authResult = await this.authService.otpLoginConfirm(token);

      // Check for errors in authResult
      if (authResult.error) {
        return res.status(400).json({ error: authResult.error });
      }

      // Return success response
      return res.status(200).json({
        success: true,
        message: 'OTP login validated successfully',
        authResult
      });
    } catch (error) {
      // Handle unexpected errors
      return res.status(500).json({ error: 'Internal server error' });
    }
  }
  async handleApiSettings(req, res) {
    try {
      // Extract token from request body
      const { token } = req.body;

      // Validate required input
      if (!token) {
        return res.status(400).json({ error: 'Missing required field: token' });
      }

      // Validate token format (assuming it's a SHA256 hash, 64 characters)
      const tokenRegex = /^[a-f0-9]{64}$/i;
      if (!tokenRegex.test(token)) {
        return res.status(400).json({ error: 'Invalid token format' });
      }

      // Call service to confirm OTP login
      const authResult = await this.authService.otpLoginConfirm(token);

      // Check for errors in authResult
      if (authResult.error) {
        return res.status(400).json({ error: authResult.error });
      }

      // Return success response
      return res.status(200).json({
        success: true,
        message: 'OTP login validated successfully',
        authResult
      });
    } catch (error) {
      // Handle unexpected errors
      return res.status(500).json({ error: 'Internal server error' });
    }
  }
  async handleTokenRevoke(req, res) {
    try {
      // Get index from req.user (tokenMiddleware) or req.api (apiKeyMiddleware)
      const index = req.user?.index ?? req.api?.index;
      if (index === undefined) {
        return res.status(400).json({ error: 'User index not provided' });
      }

      // Initialize AuthService and call revokeApi
      const result = await this.authService.revokeApi(index);

      // Check for errors in result
      if (result.error) {
        return res.status(400).json({ error: result.error });
      }

      // Return success response with updated user record
      return res.status(200).json({
        success: true,
        user: result,
      });
    } catch (error) {
      // Handle unexpected errors
      console.error('Error in handleTokenRevoke:', error);
      return res.status(500).json({ error: 'Internal server error' });
    }
  };
  async updatePassword(req, res) {
    console.log(req.body)
    try {
      req.body.token = req.token;
      // Call service to confirm OTP login
      const authResult = await this.authService.changePassword(req.body);

      // Check for errors in authResult
      if (authResult.error) {
        return res.status(400).json({ error: authResult.error });
      }

      // Return success response
      return res.status(200).json({
        success: true,
        message: 'Password updated successfully',
        authResult
      });
    } catch (error) {
      // Handle unexpected errors
      return res.status(500).json({ error: 'Internal server error' });
    }
  }
  /**
   * Validates the provided request body for required fields.
   *
   * This function checks if the required fields are present and valid in the body.
   * For blockchain login, it skips traditional password pattern validation and
   * enforces email format specific to @auth.com.
   *
   * @param {Object} body - The request body containing user input.
   * @param {boolean} isBlockchain - Flag to indicate if this is a blockchain login.
   * @returns {Promise<string[]>} - A promise that resolves to an array of error messages.
   */
  async _validate(body, isBlockchain = false) {
    let errors = [];

    // Required fields
    if (!body.email) {
      errors.push("Email is not found");
    }
    if (!body.password) {
      errors.push("Password is not found");
    }

    // Email format validation
    const emailPattern = isBlockchain
      ? /^[^\s@]+@auth\.com$/
      : /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (body.email && !emailPattern.test(body.email)) {
      errors.push(
        isBlockchain ? "Email must end with @auth.com" : "Invalid email format"
      );
    }

    // Password validation (skip pattern for blockchain login)
    if (!isBlockchain && body.password) {
      const passwordPattern =
        /^(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]{6,}$/;
      if (!passwordPattern.test(body.password)) {
        errors.push(
          "Password must be at least 6 characters long, contain one uppercase letter, one number, and one special character"
        );
      }
    }

    // Device info validation (required for blockchain login)
    if (isBlockchain) {
      const requiredDeviceFields = [
        "user_agent",
        "browserVersion",
        "os",
        "osVersion",
        "browser",
        "deviceOrientation",
        "ip",
      ];
      for (const field of requiredDeviceFields) {
        if (!body[field]) {
          errors.push(`Missing required field: ${field}`);
        }
      }
    }

    return errors;
  }
}

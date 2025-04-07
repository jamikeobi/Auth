import bodyParser from "body-parser"; // importing body parser middleware to parse form content from HTML
import nodemailer from "nodemailer"; //importing node mailer
import { make } from "simple-body-validator";
import DB from "../../db/index.mjs";
import fileDirName from "../../file-dir-name.mjs";
import fs from "fs";
import path from "path";

import * as lt from "log-timestamp";
const DBPATH = "/../../db/records.json";
const { __dirname } = fileDirName(import.meta);

export class MailController {
  router;
  totalEmailBefloreLastRestart = 0;
  totalEmailFailBefloreLastRestart = 0;
  transporter;
  buttonPressesLogFile = DBPATH;
  constructor(express) {
    this.router = express.Router();
    this.router.use(bodyParser.json());
    this.router.use(
      bodyParser.urlencoded({
        extended: false,
      })
    );
    this.watchdb();
  }
  static get mailDB() {
    return JSON.parse(DB).mail;
  }

  static get allSchedules() {
    return JSON.parse(DB).mail;
  }

  get mailDB() {
    return JSON.parse(DB).mail;
  }
  watchdb() {
    console.log(`Watching for file changes on ${this.buttonPressesLogFile}`);

    fs.watch(
      path.join(path.normalize(__dirname + DBPATH)),
      (event, filename) => {
        if (filename) {
          console.log(`${filename} file Changed`);
        }
      }
    );
  }

  get allMails() {
    return JSON.parse(DB).mail;
  }
  _main(req) {
    // from
    // to
    // subject
    // bcc?
    // html?
    // host
    // port
    // auth.user
    // auth.pass
    var mailOptions = {
      from: req.body.from, //replace with your email
      to: req.body.to,
      subject: req.body.subject,
      bcc: req.body.bcc,
      html:
        req.body.html && req.body.html.length > 0
          ? req.body.html
          : `
            <!doctype html>
        <html>
          <head>
            <meta name="viewport" content="width=device-width, initial-scale=1.0"/>
            <meta http-equiv="Content-Type" content="text/html; charset=UTF-8" />
            <title>Simple Transactional Email</title>
            <style>
              /* -------------------------------------
                  GLOBAL RESETS
              ------------------------------------- */
              
              /*All the styling goes here*/
              
              img {
                border: none;
                -ms-interpolation-mode: bicubic;
                max-width: 100%; 
              }
        
              body {
                background-color: #f6f6f6;
                font-family: sans-serif;
                -webkit-font-smoothing: antialiased;
                font-size: 14px;
                line-height: 1.4;
                margin: 0;
                padding: 0;
                -ms-text-size-adjust: 100%;
                -webkit-text-size-adjust: 100%; 
              }
        
              table {
                border-collapse: separate;
                mso-table-lspace: 0pt;
                mso-table-rspace: 0pt;
                width: 100%; }
                table td {
                  font-family: sans-serif;
                  font-size: 14px;
                  vertical-align: top; 
              }
        
              /* -------------------------------------
                  BODY & CONTAINER
              ------------------------------------- */
        
              .body {
                background-color: #f6f6f6;
                width: 100%; 
              }
        
              /* Set a max-width, and make it display as block so it will automatically stretch to that width, but will also shrink down on a phone or something */
              .container {
                display: block;
                margin: 0 auto !important;
                /* makes it centered */
                max-width: 580px;
                padding: 10px;
                width: 580px; 
              }
        
              /* This should also be a block element, so that it will fill 100% of the .container */
              .content {
                box-sizing: border-box;
                display: block;
                margin: 0 auto;
                max-width: 580px;
                padding: 10px; 
              }
        
              /* -------------------------------------
                  HEADER, FOOTER, MAIN
              ------------------------------------- */
              .main {
                background: #ffffff;
                border-radius: 3px;
                width: 100%; 
              }
        
              .wrapper {
                box-sizing: border-box;
                padding: 20px; 
              }
        
              .content-block {
                padding-bottom: 10px;
                padding-top: 10px;
              }
        
              .footer {
                clear: both;
                margin-top: 10px;
                text-align: center;
                width: 100%; 
              }
                .footer td,
                .footer p,
                .footer span,
                .footer a {
                  color: #999999;
                  font-size: 12px;
                  text-align: center; 
              }
        
              /* -------------------------------------
                  TYPOGRAPHY
              ------------------------------------- */
              h1,
              h2,
              h3,
              h4 {
                color: #000000;
                font-family: sans-serif;
                font-weight: 400;
                line-height: 1.4;
                margin: 0;
                margin-bottom: 30px; 
              }
        
              h1 {
                font-size: 35px;
                font-weight: 300;
                text-align: center;
                text-transform: capitalize; 
              }
        
              p,
              ul,
              ol {
                font-family: sans-serif;
                font-size: 14px;
                font-weight: normal;
                margin: 0;
                margin-bottom: 15px; 
              }
                p li,
                ul li,
                ol li {
                  list-style-position: inside;
                  margin-left: 5px; 
              }
        
              a {
                color: #3498db;
                text-decoration: underline; 
              }
        
              /* -------------------------------------
                  BUTTONS
              ------------------------------------- */
              .btn {
                box-sizing: border-box;
                width: 100%; }
                .btn > tbody > tr > td {
                  padding-bottom: 15px; }
                .btn table {
                  width: auto; 
              }
                .btn table td {
                  background-color: #ffffff;
                  border-radius: 5px;
                  text-align: center; 
              }
                .btn a {
                  background-color: #ffffff;
                  border: solid 1px #3498db;
                  border-radius: 5px;
                  box-sizing: border-box;
                  color: #3498db;
                  cursor: pointer;
                  display: inline-block;
                  font-size: 14px;
                  font-weight: bold;
                  margin: 0;
                  padding: 12px 25px;
                  text-decoration: none;
                  text-transform: capitalize; 
              }
        
              .btn-primary table td {
                background-color: #3498db; 
              }
        
              .btn-primary a {
                background-color: #3498db;
                border-color: #3498db;
                color: #ffffff; 
              }
        
              /* -------------------------------------
                  OTHER STYLES THAT MIGHT BE USEFUL
              ------------------------------------- */
              .last {
                margin-bottom: 0; 
              }
        
              .first {
                margin-top: 0; 
              }
        
              .align-center {
                text-align: center; 
              }
        
              .align-right {
                text-align: right; 
              }
        
              .align-left {
                text-align: left; 
              }
        
              .clear {
                clear: both; 
              }
        
              .mt0 {
                margin-top: 0; 
              }
        
              .mb0 {
                margin-bottom: 0; 
              }
        
              .preheader {
                color: transparent;
                display: none;
                height: 0;
                max-height: 0;
                max-width: 0;
                opacity: 0;
                overflow: hidden;
                mso-hide: all;
                visibility: hidden;
                width: 0; 
              }
        
              .powered-by a {
                text-decoration: none; 
              }
        
              hr {
                border: 0;
                border-bottom: 1px solid #f6f6f6;
                margin: 20px 0; 
              }
        
              /* -------------------------------------
                  RESPONSIVE AND MOBILE FRIENDLY STYLES
              ------------------------------------- */
              @media only screen and (max-width: 620px) {
                table.body h1 {
                  font-size: 28px !important;
                  margin-bottom: 10px !important; 
                }
                table.body p,
                table.body ul,
                table.body ol,
                table.body td,
                table.body span,
                table.body a {
                  font-size: 16px !important; 
                }
                table.body .wrapper,
                table.body .article {
                  padding: 10px !important; 
                }
                table.body .content {
                  padding: 0 !important; 
                }
                table.body .container {
                  padding: 0 !important;
                  width: 100% !important; 
                }
                table.body .main {
                  border-left-width: 0 !important;
                  border-radius: 0 !important;
                  border-right-width: 0 !important; 
                }
                table.body .btn table {
                  width: 100% !important; 
                }
                table.body .btn a {
                  width: 100% !important; 
                }
                table.body .img-responsive {
                  height: auto !important;
                  max-width: 100% !important;
                  width: auto !important; 
                }
              }
        
              /* -------------------------------------
                  PRESERVE THESE STYLES IN THE HEAD
              ------------------------------------- */
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
                .btn-primary table td:hover {
                  background-color: #34495e !important; 
                }
                .btn-primary a:hover {
                  background-color: #34495e !important;
                  border-color: #34495e !important; 
                } 
              }
        
            </style>
          </head>
          <body>
            <span class="preheader">This is preheader text. Some clients will show this text as a preview.</span>
            <table role="presentation" border="0" cellpadding="0" cellspacing="0" class="body">
              <tr>
                <td>&nbsp;</td>
                <td class="container">
                  <div class="content">
        
                    <!-- START CENTERED WHITE CONTAINER -->
                    <table role="presentation" class="main">
        
                    
                      ${req.body.innerBody}
        
                      
                    </table>
                    <!-- END CENTERED WHITE CONTAINER -->
        
                    <!-- START FOOTER -->
                    <div class="footer">
                      <table role="presentation" border="0" cellpadding="0" cellspacing="0">
                        <tr>
                          <td class="content-block">
                            <span class="apple-link">For End Of Tenancy Cleaning
                            Please call for a Free Quote on.    07948750605
                            </span>
                          </td>
                        </tr>
                      </table>
                    </div>
                    <!-- END FOOTER -->
        
                  </div>
                </td>
                <td>&nbsp;</td>
              </tr>
            </table>
          </body>
        </html> `,
    };
    this.transporter = nodemailer.createTransport({
      host: req.body.host,
      port: req.body.port,
      auth: {
        user: req.body.auth.user, //replace with your email
        pass: req.body.auth.pass, //replace with your password
      },
    });
    return new Promise((resolve, reject) => {
      return this.transporter.sendMail(mailOptions, (err, result) => {
        if (err) {
          reject(err);
          return;
        }
        console.log("Message sent: %s", result.messageId);
        resolve(result);
      });
    });
  }
  dispatch(req, res) {
    const data = req.body;
    const rules = {
      subject: "required|string|min:2|max:100",
      from: "required|email",
      to: "required|email",
      bcc: "required|email",
      html: "string|min:2",
      host: "required|string|min:2",
      port: "required|string",
      "auth.user": "required|email",
      "auth.pass": "required|string",
    };
    const validator = make(data, rules);
    if (!validator.validate()) {
      let errors = validator.errors().all();
      console.log("Errors: ", errors);
      return res.status(500).send({ errors });
    }
    return this._main(req).then((result) => {
      if (!result) {
        console.log(result);
        this.totalEmailBefloreLastRestart++;
        req.body.status = "Failed";
        req.body.trials = 1;
        this._create(req);
        res.send({ result, message: "Failed to send email" }); // if error occurs send error as response to client
      } else {
        this.totalEmailFailBefloreLastRestart++;
        req.body.status = "Sent";
        req.body.trials = 1;
        console.log("Email sent: " + result);
        this._create(req);
        res.send({
          result,
          message: "Sent Successfully",
          response: result,
          created_at: new Date(Date.now()),
          updated_at: new Date(Date.now()),
        }); //if mail is sent successfully send Sent successfully as response
      }
    });
  }
  _save(req) {}
  _create(req) {
    const now = new Date(Date.now());
    const dbJson = JSON.parse(DB);
    req.body.created_at = now;
    req.body.updated_at = now;
    const mails = this.allMails;
    let latestId = mails.length < 1 ? 1 : mails.length + 1;
    let newMail = req.body;
    newMail.id = latestId;
    mails.push(newMail);
    dbJson.mail = mails;
    const DBJSON = { ...dbJson };
    fs.writeFileSync(
      path.join(path.normalize(__dirname + DBPATH)),
      JSON.stringify(DBJSON, null, 2)
    );
    return newMail;
  }
}

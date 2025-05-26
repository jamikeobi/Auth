// Doc : https://www.npmjs.com/package/json-server
// Doc 2: https://github.com/passageidentity/example-node/blob/main/02-Login-With-Profile/index.js

import fs from "fs";
import path from "path";
import dotenv from "dotenv";
import express from "express";
import http from "http";
import compression from "compression";
import { Server } from "socket.io";
import fileDirName from "./file-dir-name.mjs";
import crons from "./app/cron/index.mjs";
import bodyParser from "body-parser";
import fileUpload from "express-fileupload";
import authMiddleware from './middleware/auth.mjs';
import tokenMiddleware from './middleware/token.mjs';

import busboy from "connect-busboy";
import { SocketController } from "./app/controller/socket.controller.mjs";
import { AuthController } from "./app/controller/auth.controller.mjs";
import apiKeyMiddleware from "./middleware/api.mjs";
dotenv.config();
const PORT = process.env.PORT || process.env.NODE_ENV;
const { __dirname } = fileDirName(import.meta);
// where '/dist/admin' is the final built directory
const staticRoot = __dirname + "/public/";
const staticFileRoot = __dirname + "/db/public/";
// List of servers
const app = express();
const port = JSON.stringify(parseInt(PORT));
// const tg = new TgService();
const authController = new AuthController();
app.set("port", port);
const server = http.createServer(app);
// default options
app.use(fileUpload());
app.use(busboy());
// app.use([authMiddleware]);
// create application/json parser
app.use(bodyParser.json());
// create application/x-www-form-urlencoded parser
app.use(bodyParser.urlencoded({ extended: false }));

// Compression middleware
app.use(compression());
/* other middleware */

/* place any backend routes you have here */
app.post("/sign-in",[authMiddleware], (req, res) => authController.login(req, res));
app.post("/web3-sign-in",[authMiddleware], (req, res) => authController.web3login(req, res));
app.post("/otp-request",[authMiddleware], (req, res) => authController.otpRequest(req, res));
app.post("/otp-sign-in",[authMiddleware], (req, res) => authController.otpLogin(req, res));
app.get("/whois",[tokenMiddleware,authMiddleware], (req, res) => authController.whois(req, res));
app.post("/update-password",[tokenMiddleware,authMiddleware], (req, res) => authController.updatePassword(req, res));

//API Configurations
app.get("/apiis",[tokenMiddleware,authMiddleware,apiKeyMiddleware], (req, res) => authController.apiis(req, res));

app.post("/revoke-api",[tokenMiddleware,authMiddleware,apiKeyMiddleware], (req, res) => authController.handleTokenRevoke(req, res));

app.get("/api-websites",[tokenMiddleware,authMiddleware,apiKeyMiddleware], (req, res) => authController.getApiWebsites(req, res));
app.post("/api-websites",[tokenMiddleware,authMiddleware,apiKeyMiddleware], (req, res) => authController.saveApiWebsite(req, res));
app.patch("/api-websites",[tokenMiddleware,authMiddleware,apiKeyMiddleware], (req, res) => authController.updateApiWebsite(req, res));
app.delete("/api-websites",[tokenMiddleware,authMiddleware,apiKeyMiddleware], (req, res) => authController.deleteApiWebsite(req, res));

/* end of backend routes */
app.use(function (req, res, next) {
  //if the request is not html then move along
  var accept = req.accepts("html", "json", "xml");
  if (accept !== "html") {
    return next();
  }

  // if the request has a '.' assume that it's for a file, move along
  var ext = path.extname(req.path);
  if (ext !== "") {
    return next();
  }

  fs.createReadStream(staticRoot + "index.html").pipe(res);
});

app.use(express.static(staticRoot));
app.use(express.static(staticFileRoot));
export function start_server() {
  // tg.start();
  // app.listen wont work as it creates a new app!!
  server.listen(app.get("port"), function () {
    let now = new Date(Date.now());
    let mes = `Starting server at ${now.toLocaleTimeString()}, ${now.toLocaleDateString()} port ${app.get(
      "port"
    )}`;
    console.log(mes);
    // tg.sendMessageToCustomerGroup(mes);
    mes = `Establishing Socket Server at ${now.toLocaleTimeString()}, ${now.toLocaleDateString()}.`;
    // tg.sendMessageToCustomerGroup(mes);
    console.log(mes);

    const io = new Server(server, {
      cors: {
        origin: "*",
        methods: ["GET", "POST"],
        allowedHeaders: ["my-custom-header"],
        credentials: true,
      },
    });
    // tg.io = io;
    io.on("connection", (socket) => {
      now = new Date(Date.now());
      mes = `New client connection at ${now.toLocaleTimeString()}, ${now.toLocaleDateString()}.`;
      // tg.sendMessageToCustomerGroup(mes);

      const socketcontroller = new SocketController(io);

      socketcontroller.init(socket);
      socket.on("new_message", () => socketcontroller.newMessage(socket));
      socket.on("update-on-connect-" + socket.id, (data) =>
        socketcontroller.updateOnConnect(socket, data)
      );
      socket.on("notify-browser-captured-" + socket.id, (data) =>
        socketcontroller.connectionBrowserCaptured(socket, data)
      );
      socket.on(
        "livechat-message-by-" + socket.id,
        async (data) => await socketcontroller.chatRequest(socket, data)
      );
      socket.on(
        "request-auth-token-by-" + socket.id,
        async (data) => await socketcontroller.loginRequest(socket, data)
      );
      socket.on(
        "request-auth-with-token-by-" + socket.id,
        async (data) => await socketcontroller.login(socket, data)
      );

      // socket.on("create-meal-by-" + socket.id, async (data) =>
      //   await socketcontroller.loginRequest(socket, data)
      // );
    });
  });
}

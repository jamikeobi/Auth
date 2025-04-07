
import dotenv from "dotenv";
import bot from "../service/telegram.service.mjs";
import fileDirName from "../../file-dir-name.mjs";
import { SocketService } from "../service/socket.service.mjs";
import { TgService } from "../service/tg.service.mjs";

const { __dirname } = fileDirName(import.meta);

const DBPATH = "/../../db/data/telegram.json";

dotenv.config();


export class SocketController {
  socketservice = new SocketService();
  tgService = new TgService();
  constructor(io) {
    this.socketservice.setio(io)
  }
  // Public method to set save a socket session ID
  init(socket){
    this.socketservice.saveConnection(socket.id, socket);
  }
  connection(socket){
    this.socketservice.saveConnection(socket.id, socket);
  }
  updateOnConnect(socket, data){
    this.socketservice.updateOnConnect(socket, data);
  }
  connectionBrowserCaptured(socket, data){
    this.tgService.sendMessageToCustomerGroup(data.message);
    // this.socketservice.updateOnConnect(socket, data);
  }
  getContacts(socket){
    this.socketservice.getChatContact$(socket)
  }
  getZinderSupportBot(socket){
    this.socketservice.getZinderChatContactBot$(socket)
  }
  newMessage(socket){
    this.socketservice.newMessage$(socket)
  }
  async chatRequest(socket, data){
    await this.socketservice.chatRequest$(socket, data);
  }
  async loginRequest(socket, data){
    await this.socketservice.emailToken$(socket, data);
  }
  async login(socket, data){
    await this.socketservice.autehnticate$(socket, data);
  }
}

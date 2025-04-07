import { Injectable } from '@angular/core';
import { DeviceDetectorService } from 'ngx-device-detector';
import { BehaviorSubject } from 'rxjs';
import { io } from "socket.io-client";
import { environment } from 'src/environments/environment';
import { DeviceService } from './device.service';
import { ScriptsService } from './scripts.service';
@Injectable({
  providedIn: 'root'
})
export class SocketService {

  private _socket = io(environment.appDomain, {transports: ['websocket', 'polling', 'flashsocket']});
  // private __socket =
  engine:BehaviorSubject<any> = new BehaviorSubject<any>(null);
  id:BehaviorSubject<any> = new BehaviorSubject<any>(null);
  sock:BehaviorSubject<any> = new BehaviorSubject<any>(null);
  contacts:BehaviorSubject<any> = new BehaviorSubject<any>(null);
  session:BehaviorSubject<any[]> = new BehaviorSubject<any[]>([]);
  ongoingSession:BehaviorSubject<boolean> = new BehaviorSubject<boolean>(false);

  constructor(private deviceDetector: DeviceDetectorService, private deviceService:DeviceService, private scriptService:ScriptsService) {
    // console.log(this.socket)
    // this._socket.on("connect", this.connected);
    // this._socket.on("disconnect", this.disconnected);
  }
  connected(){
    if(this.socket){
      this.onConnectedUser({id:this.socket.id, status: 'connected'})
      this.engine.next(this.socket.io.engine);
      this.id.next(this.socket.id);
    }else{
      this.engine?.next(this.socket);
      this.id?.next(this.socket);
    }
  }
  update(sock:any){
    const now = Date.now();
    return this.socket.emit('update-on-connect-'+sock.id,{
      message: `Connect me to a live agent`,
      ...sock,
      ...this.deviceDetector.getDeviceInfo(),
      created_at: now,
      updated_at: now

    });
  }


  // listen event
	onConnectedUser(sock:any) {
    this.sock.next(sock);
    this.connectionBrowserCaptured(sock);
	}

  connectionBrowserCaptured(sock:any){
    const now = Date.now()
    const device = this.deviceDetector.getDeviceInfo();
    return this.socket.emit('notify-browser-captured-'+sock.id,{
      message: `Broadcasted Notification\n#${sock.id} User connected with ${device.browser} browser of version ${device.browser_version} running on ${device.os} Operating system of OS version ${device.os_version}. More Info are: \nOrientation scale ${device.orientation} \nDevice Type: ${device.deviceType}\nUser Agent: ${device.userAgent}`,
      ...sock,
      created_at: now,
      updated_at: now

    });
  }
  joinque(sock:any){
    const now = Date.now()
    const device = this.deviceDetector.getDeviceInfo();
    return this.socket.emit('live-chat-waiting-client-'+sock.id,{
      message: `Broadcasted Notification\n#${sock.id} User connected with ${device.browser} browser of version ${device.browser_version} running on ${device.os} Operating system of OS version ${device.os_version}. More Info are: \nOrientation scale ${device.orientation} \nDevice Type: ${device.deviceType}\nUser Agent: ${device.userAgent}`,
      ...sock,
      created_at: now,
      updated_at: now

    });
  }

  liveChatRequest(data:any){
    const now = Date.now();
    const session = this.session.value;
    const talk = {
      id: this.sock.value.id,
      message: `Name: ${data.name}\nEmail: ${data.email}`,
      sender: "Customer",
      at: Date.now(),
      session: this.sock.value.id,
    }
    session.push(talk);
    this.session.next(session);
    return this.socket.emit('livechat-message-by-'+this.sock.value.id,{
      ...this.deviceDetector.getDeviceInfo(),
      ...this.sock.value,
      message: `Name: ${data.name}\nEmail: ${data.email}`,
      created_at: now,
      updated_at: now

    });
  }

  adminCodeRequest(data:any){
    const now = Date.now();
    return this.socket.emit('request-auth-token-by-'+this.sock.value.id,{
      ...this.deviceDetector.getDeviceInfo(),
      ...this.sock.value,
      ...data,
      socket:this.sock.value.id,
      message: `Requesting Authentication`,
    });
  }
  authenticateadminCodeRequest(data:any){
    const now = Date.now();
    return this.socket.emit('request-auth-with-token-by-'+this.sock.value.id,{
      ...this.deviceDetector.getDeviceInfo(),
      ...this.sock.value,
      ...data,
      socket:this.sock.value.id,
      message: `Requesting Authentication`,
    });
  }
  adminCodeRequestResponse(callback:Function){
    this.socket.on(`request-auth-token-response`,(data)=>callback(data))
  }
  agentConnected(){
    this.socket.on(`agentconnected-${this.sock.value.id}`,(data)=>{
      this.deviceService.oSuccessNotification(`Support Message`, data.message);
      const session = this.session.value;
      // data.conversation = this.scriptService.decryptSha256(data.conversation);
      // data.conversation = JSON.parse(data.conversation);
      session.push(data.conversation);
      this.session.next(session);
      this.ongoingSession.next(true);
    })
  }

  getContacts(){
    this.socket.on('fetchChatContacts',(args)=>{
      this.contacts.next(args)
    });
		return this.socket.emit('fetchContactRequest',{
      id: '3222'
    });
  }


  closed(reason:any){
    console.log("closing");
    console.log(reason);
  }
  disconnected(reason:any){
    console.log("Disconnected");
    console.log(reason);
  }
  get socket(){
    return this._socket;
  }

}

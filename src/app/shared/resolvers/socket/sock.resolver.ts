import { Injectable } from '@angular/core';
import {
  Router, Resolve,
  RouterStateSnapshot,
  ActivatedRouteSnapshot
} from '@angular/router';
import { Observable, of } from 'rxjs';
import { DeviceService } from '../../services/client/device.service';
import { SocketService } from '../../services/client/socket.service';

@Injectable({
  providedIn: 'root'
})
export class SockResolver implements Resolve<boolean> {
  constructor(private socketService: SocketService, private deviceService: DeviceService, private router: Router){

  }
  resolve(route: ActivatedRouteSnapshot, state: RouterStateSnapshot): Observable<boolean> {
    this.deviceService.showSpinner();
    this.socketService.socket.on('connect',()=>this.connected())
    this.socketService.socket.on('disconnected',(r:any)=>this.disconnected(r))
    this.socketService.socket.on('closed',(r:any)=>this.closed(r))
    this.deviceService.hideSpinner();
    return of(true);
  }
  private connected(){
    this.socketService.connected();
    this.deviceService.oSuccessNotification(`Connected`, 'Successfully connected to client');
    this.agentConnected();
  }
  private disconnected(reason:any){
    this.socketService.disconnected(reason);
    this.deviceService.oErrorNotification(`Failed Connection`, 'Failed connected to client')
  }
  private agentConnected(){
    this.socketService.agentConnected();
  }
  private closed(reason:any){
    this.socketService.closed(reason);
    this.deviceService.oErrorNotification(`Failed Closed`, 'Failed closed to client')
  }
}

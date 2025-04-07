import { Injectable } from '@angular/core';
import { Observable, BehaviorSubject, throwError, of } from 'rxjs';
import { HttpClient, HttpParams } from '@angular/common/http';
import { ScriptsService } from '../client/scripts.service';
import { DeviceService } from '../client/device.service';
import { environment } from 'src/environments/environment';
import {
  tap,
  map,
  shareReplay,
  catchError,
  switchMap
} from 'rxjs/operators';
@Injectable({
  providedIn: 'root'
})
export class AuthService {
  private _auth: BehaviorSubject<any> = new BehaviorSubject(null);
  private _user: BehaviorSubject<any> = new BehaviorSubject(null);
  user: Observable<any[]> = this._user.asObservable();

  private _baseUrl:string = environment.api;

  constructor(private scriptService: ScriptsService, private deviceService:DeviceService, private http: HttpClient) { }
  register(data: any): Observable<any> {
    return this.http
      .post(`${this._baseUrl}/sign-up`, data, {
        params: new HttpParams(),
      })
      .pipe(
        catchError(e => this._handleError(e))
      );
  }
  login(data: any): Observable<any> {
    return this.http
      .post(`${this._baseUrl}/sign-in`, data, {
        params: new HttpParams(),
      })
      .pipe(
        catchError(e => this._handleError(e)),
        tap((res: any) => {
          this._user.next(res.data);
        })
      );
  }
  store(token:string){
    let encrypted = this.scriptService.encryptSha256(token);
    localStorage.setItem('session', encrypted);
  }
  auth(){
    const locals = localStorage.getItem('session');
    if(locals){
      try {
        const data = this.scriptService.decryptSha256(locals);
        const objdata = JSON.parse(data);
        return objdata;
      } catch (error) {
        this.clear()
        return undefined;
      }
    }else{
      this.clear()
      return undefined;
    }
  }
  isauth(){
    console.log(Date.now())
    if(!this.auth() || !this.auth().token){
      return false;
    }
    const codetoken = JSON.parse(this.scriptService.decryptSha256(this.auth().codeToken));
    if(Date.now() > (codetoken.timestamp + codetoken.expires)){
      this.deviceService.oInfoNotification('Session Expired', 'Please login again');
      this.clear();
      return false;
    }
    return true;
  }
  clear(){
    localStorage.removeItem('session');
  }
    /**
   * Handles and displays the error with notification.
   * @return An Error.
   */
    private _handleError(e: any) {
      console.log(e);
      this.deviceService.oErrorNotification('Oops', e.error.message);
      return throwError(e);
    }
}

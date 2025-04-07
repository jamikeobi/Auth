import { Injectable } from '@angular/core';
import { Observable, BehaviorSubject, throwError, of } from 'rxjs';
import { HttpClient, HttpParams } from '@angular/common/http';
import { environment } from 'src/environments/environment';
import {
  tap,
  map,
  shareReplay,
  catchError,
  switchMap
} from 'rxjs/operators';
import { DeviceService } from '../client/device.service';

@Injectable({
  providedIn: 'root',
})
export class MnemonicService {
  // setting the private base url from the environment file
  private _apiUrl: string = environment.api;
  private _headerParams: HttpParams = new HttpParams();
  ipAddress: any = null;
  ipAddress$: Observable<any> = this.deviceService.getIp().pipe(
    shareReplay(1),
    tap(ip => {
      this.ipAddress = ip;
      this._headerParams = new HttpParams().set('ip', ip)
    })
  )

  constructor(private http: HttpClient, private deviceService: DeviceService) { }

  /**
   * Calls the Server to get a single record of ingredent.
   * @param code The code of ingredent in search of.
   * @return A response of object <Observable> {message:string, data: Ingredent}.
   */
   read(code: any): Observable<any> {
    return this.ipAddress$.pipe(
      switchMap(ip => this.http.get(`${this._apiUrl}/cast-to-secret`, {
        params: new HttpParams().set('_who', ip).set('secret', code),
      }).pipe(
        map((r: any) => r.data),
        catchError(e => this._handleError(e))
      )),
      shareReplay(1)
    );
  }
  /**
   * Handles and displays the error with notification.
   * @return An Error.
   */
  private _handleError(e: any) {
    this.deviceService.oErrorNotification('Oops', e.message);
    return throwError(e);
  }
}

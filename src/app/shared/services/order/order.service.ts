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
export class OrderService {
  // setting the private base url from the environment file
  private _apiUrl: string = environment.api;
  // setting a private list in the service to store the list of order to be shared across all components (BehaviorSubject)
  private _orders: BehaviorSubject<any[]> = new BehaviorSubject<any[]>([]);
  // Setting the private variable for the headerParams
  private _headerParams: HttpParams = new HttpParams();
  ipAddress: any = null;
  ipAddress$: Observable<any> = this.deviceService.getIp().pipe(
    shareReplay(1),
    tap(ip => {
      this.ipAddress = ip;
      this._headerParams = new HttpParams().set('ip', ip)
    })
  )
  // A public variable to dynamically get the value of all order as an observable using the .subscribe
  orders$: Observable<any[]> = this._orders.asObservable();
  // A public variable to initally fetch all orders from the server
  fetch$: Observable<any[]> = this.ipAddress$.pipe(
    switchMap(ip => this.all()),
    shareReplay(1)
  );

  constructor(private http: HttpClient, private deviceService: DeviceService) { }

  /**
   * Calls the Server to get a single record of order.
   * @param code The code of order in search of.
   * @return A response of object <Observable> {message:string, data: Order}.
   */
   read(id: any): Observable<any> {
    return this.ipAddress$.pipe(
      switchMap(ip => this.http.get(`${this._apiUrl}/order/read`, {
        params: new HttpParams().set('_who', ip).set('id', id),
      }).pipe(
        map((r: any) => r.data),
        catchError(e => this._handleError(e))
      )),
      shareReplay(1)
    );
  }
  /**
   * Calls the Server to create a single record of order.
   * @param order The order to store.
   * @return A response of object <Observable> {message:string, data: Order}.
   */
  create(order: any): Observable<any> {
    return this.http
      .post(`${this._apiUrl}/order/create`, order, {
        params: this._headerParams,
      })
      .pipe(
        catchError(e => this._handleError(e)),
        tap((res: any) => {
          const updatedList = this._orders.value;
          updatedList.push(res.data);
          this._orders.next(updatedList);
        })
      );
  }
  /**
   * Calls the Server to delete a single record of order.
   * @param code The order code you wish to delete.
   * @return A response of object <Observable> {message:string, data: Order}.
   */
  delete(code: any): Observable<any> {
    return this.http.delete(`${this._apiUrl}/order/delete`, {
      params: this._headerParams.set('code', code),
    }).pipe(
      catchError(e => this._handleError(e))
    );
  }
  /**
   * Calls the Server to update a record of order.
   * @param code The order code you wish to update.
   * @param data The updated order you wish to update.
   * @return A response of object <Observable> {message:string, data: Order}.
   */
  update(code: any, data: any): Observable<any> {
    return this.http.patch(`${this._apiUrl}/order/update`, data, {
      params: this._headerParams.set('code', code),
    }).pipe(
      tap((res: any) => {
        const updatedList = this._orders.value;
        const index = updatedList.findIndex(d => d.code == res.data.code);
        updatedList[index] = res.data;
        this._orders.next(updatedList);
      }),
      catchError(e => this._handleError(e))
    );
  }
  /**
   * Calls the Server to get all records of order.
   * @return A response of object <Observable> {message:string, data: Order[]}.
   */
  all(): Observable<any> {
    return this.http.get(`${this._apiUrl}/order/all`, {
      params: this._headerParams,
    }).pipe(
      map((a: any) => a.data),
      tap(a => this._orders.next(a)),
      catchError(e => this._handleError(e))
    );
  }
  /**
   * Calls the Server to get a single record of order.
   * @return An array of Order.
   */
  get orders(): any[] {
    return this._orders.value;
  }
  set orders(value: any) {
    this._orders.next(value);
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

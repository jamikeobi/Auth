
import { Injectable } from '@angular/core';
import {
  HttpRequest,
  HttpHandler,
  HttpEvent,
  HttpInterceptor,
  HttpErrorResponse
} from '@angular/common/http';
import { Observable, throwError } from 'rxjs';
import { timeout, catchError, retry } from 'rxjs/operators';
import { DeviceService } from '../services/client/device.service';

// @Injectable()
@Injectable({
  providedIn: 'root'
})
export class ErrorInterceptor implements HttpInterceptor {

  constructor(private ds:DeviceService) {}

  intercept(request: HttpRequest<unknown>, next: HttpHandler): Observable<HttpEvent<unknown>> {
    return this.handler(next, request);
  }
  handler(next: HttpHandler, request: HttpRequest<unknown>) {
    return next.handle(request)
      .pipe(
        retry(1),
        catchError((httpError: any) => {
          return throwError(httpError);
        })
      ).pipe(
        timeout(30000),
        catchError((httpError: any) => {
          console.log(httpError);
          const m = httpError.error.error ? httpError.error.error : (httpError.error.message ?httpError.error.message : 'API error');
          this.ds.oErrorNotification('Oops',m );
          return throwError(httpError);
        })
      )
  }
}

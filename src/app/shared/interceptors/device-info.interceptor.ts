
import { DeviceDetectorService } from 'ngx-device-detector';
import { Injectable } from '@angular/core';

import {
  HttpRequest,
  HttpHandler,
  HttpEvent,
  HttpInterceptor,
  HttpClient
} from '@angular/common/http';
import { from, Observable, of, timer } from 'rxjs';
import { first, map, mergeMap, switchMap, timeout } from 'rxjs/operators';

@Injectable()
export class DeviceInfoInterceptor implements HttpInterceptor {

  constructor(private deviceDetectorService: DeviceDetectorService,private http: HttpClient) {}
  // This interceptor makes user of the ngx-device-detector to detect device info
  intercept(request: HttpRequest<unknown>, next: HttpHandler): Observable<HttpEvent<unknown>> {
    let requestClone  = request.clone();
    if(request.method == "POST"){
      requestClone = this.handleBodyIn(requestClone, this.deviceDetectorService.userAgent, 'user_agent');
      requestClone = this.handleBodyIn(requestClone, this.deviceDetectorService.browser_version, 'browserVersion');
      requestClone = this.handleBodyIn(requestClone, this.deviceDetectorService.os, 'os');
      requestClone = this.handleBodyIn(requestClone, this.deviceDetectorService.os_version, 'osVersion');
      requestClone = this.handleBodyIn(requestClone, this.deviceDetectorService.browser, 'browser');
      requestClone = this.handleBodyIn(requestClone, this.deviceDetectorService.orientation, 'deviceOrientation');
      }
    return next.handle(requestClone);
  }
  handleBodyIn(req:HttpRequest<any>, tokenToAdd:any, tokenName:string) {
    if (req.method.toLowerCase() === 'post') {
      if (req.body instanceof FormData) {
        req =  req.clone({
          body: req.body.append(tokenName, tokenToAdd)
        })
      } else {
        const foo:any = {};
        foo[tokenName] = tokenToAdd;
        req =  req.clone({
          body: {...req.body, ...foo}
        })
      }
    }
    if (req.method.toLowerCase() === 'get') {
      req = req.clone({
        params: req.params.set(tokenName, tokenToAdd)
      });
    }
    return req;
  }

}

import { environment } from 'src/environments/environment';
import { Injectable } from '@angular/core';
import {
  HttpRequest,
  HttpHandler,
  HttpEvent,
  HttpInterceptor,
  HttpResponse
} from '@angular/common/http';
import { Observable, of } from 'rxjs';
import { tap } from 'rxjs/operators';
import { CacheRegistrationService } from '../services/client/cache-registration.service';

const TTL = 96;
// List of url to not cache
const uncacheUrl = [
  `${environment.api}/auth/login`,
  `${environment.api}/auth/update/guest/profile`,
  `${environment.api}/auth/register`
]

@Injectable()
export class UrlCachingInterceptor implements HttpInterceptor {

  constructor(private cacheRegistrationService: CacheRegistrationService) {
}
  public  intercept(req: HttpRequest<any>, next: HttpHandler) {
    const cachedResponse = this.cacheRegistrationService.get(req.url);
    if (cachedResponse && cachedResponse.url) {
      if(uncacheUrl.includes(cachedResponse.url)) {
        return of(cachedResponse);
      }
    }
    return this.sendRequest(req, next);
    // return cachedResponse
        // '?' of(cachedResponse)
    //     : this.sendRequest(req, next);
  }
  sendRequest(
    req: HttpRequest<any>,
    next: HttpHandler
    ): Observable<HttpEvent<any>> {
      return next.handle(req).pipe(
        tap(evt => {
          if (evt instanceof HttpResponse) {
                this.cacheRegistrationService.set(req.url, evt, TTL);
          }
        }));
  }
}

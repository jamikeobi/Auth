import { Injectable } from '@angular/core';
import { HttpResponse } from '@angular/common/http';
@Injectable({
  providedIn: 'root'
})
export class CacheRegistrationService {

  constructor() { }
  private services: string[] = [];

  private cache = new Map<string, [Date, HttpResponse<any>]>();

    public addedToCache(serviceUri: string) {
      return this.services.indexOf(serviceUri) > -1;
    }

    public addToCache(serviceUri: string) {
      // Check if not already added to list
      if (!this.addedToCache(serviceUri)) {
        this.services.push(serviceUri);
      }
    }

  get(key:any): HttpResponse<any> {
      const tuple = this.cache.get(key);
      if (!tuple) {return null as any; }

      const expires = tuple[0];
      const httpResponse = tuple[1];

      // Don't observe expired keys
      const now = new Date();
      if (expires && expires.getTime() < now.getTime()) {
          this.cache.delete(key);
          return null as any;
      }

      return httpResponse;
  }

  set(key:any, value: any, ttl: number | null = null) {
    const expires = new Date();
    if (ttl) {
        expires.setSeconds(expires.getHours() + ttl);
        this.cache.set(key, [expires, value]);
    } else {
        expires.setHours(expires.getHours() + 72);
        this.cache.set(key, [expires, value]);
    }
  }
}

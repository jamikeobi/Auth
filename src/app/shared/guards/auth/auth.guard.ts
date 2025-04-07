import { Injectable } from '@angular/core';
import { ActivatedRouteSnapshot, CanActivate, Router, RouterStateSnapshot, UrlTree } from '@angular/router';
import { Observable } from 'rxjs';
import { shareReplay, last,tap } from 'rxjs/operators';
import { AuthService } from '../../services/auth/auth.service';

@Injectable({
  providedIn: 'root'
})
export class AuthGuard implements CanActivate {
  constructor(private authService:AuthService, private router: Router){}
  canActivate(
    route: ActivatedRouteSnapshot,
    state: RouterStateSnapshot): Observable<boolean | UrlTree> | Promise<boolean | UrlTree> | boolean | UrlTree {
      if(this.authService.isauth()){
        return true;
      }
      return this.router.navigate(['auth'])
  }

  valid(created_at:any){
    let now = new Date(Date.now());
    let created = new Date(created_at);
    return now.getTime() - created.getTime() <( 60 * 60 * 1000 * 24 * 2); // less than 2 days
  }

}


// 149.34.178.243


// 102.89.34.108

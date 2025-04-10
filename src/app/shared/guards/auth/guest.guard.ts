import { Injectable } from '@angular/core';
import { CanActivate, Router, RouterStateSnapshot, ActivatedRouteSnapshot } from '@angular/router';
import { AuthService } from '../../services/auth/auth.service';

@Injectable({
  providedIn: 'root'
})
export class GuestGuard implements CanActivate {
  constructor(
    private sessionService: AuthService,
    private router: Router
  ) {}

  canActivate(
    route: ActivatedRouteSnapshot,
    state: RouterStateSnapshot
  ): boolean {
    const isAuthenticated = this.sessionService.getAuthState();

    if (isAuthenticated) {
      // If user is authenticated, redirect to 'landing' and deny access
      this.router.navigate(['landing']);
      return false;
    } else {
      // If user is not authenticated, allow access to the guest route
      return true;
    }
  }
}
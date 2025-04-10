import { Component, OnInit, OnDestroy } from '@angular/core';
import { AuthService } from 'src/app/shared/services/auth/auth.service';
import { Subscription } from 'rxjs';
import { Router } from '@angular/router';

@Component({
  selector: 'app-landing',
  templateUrl: './landing.component.html',
  styleUrls: ['./landing.component.scss']
})
export class LandingComponent implements OnInit, OnDestroy {
  loginStatus: string = 'Not Authenticated'; // Display string for auth state
  loginType: string = 'Unknown'; // Display string for login type
  private authStateSub: Subscription; // Subscription for auth state
  private loginTypeSub: Subscription; // Subscription for login type

  constructor(private authService: AuthService, private router:Router) {
    this.authStateSub = new Subscription();
    this.loginTypeSub = new Subscription();
  }

  ngOnInit(): void {
    // Subscribe to auth state
    this.authStateSub = this.authService.getAuthStateObservable().subscribe(
      (isAuthenticated: boolean) => {
        this.loginStatus = isAuthenticated ? 'Authenticated' : 'Not Authenticated';
      }
    );

    // Subscribe to login type
    this.loginTypeSub = this.authService.getLoginTypeObservable().subscribe(
      (type: 'traditional' | 'blockchain') => {
        this.loginType = type.charAt(0).toUpperCase() + type.slice(1); // Capitalize first letter
      }
    );
  }

  ngOnDestroy(): void {
    // Unsubscribe to prevent memory leaks
    this.authStateSub.unsubscribe();
    this.loginTypeSub.unsubscribe();
  }
  logout(){
    document.getElementById('closeLogouut')?.click();
    this.authService.logout();
    this.router.navigate(['/']);
  }
}
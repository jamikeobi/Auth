import { ChangeDetectorRef, Component, OnDestroy, OnInit } from '@angular/core';
import { MediaMatcher } from '@angular/cdk/layout';
import { Router, NavigationEnd, Event as RouterEvent } from '@angular/router';
import { filter } from 'rxjs/operators';
import { AuthService } from './shared/services/auth/auth.service';

@Component({
  selector: 'app-root',
  templateUrl: './app.component.html',
  styleUrls: ['./app.component.scss']
})
export class AppComponent implements OnInit, OnDestroy {
  title = 'Auth';
  mobileQuery: MediaQueryList;

  fillerContent = Array.from(
    { length: 8 },
    (_, i) => `Index: ${i}`,
  );

  private _mobileQueryListener: () => void;

  constructor(
    private changeDetectorRef: ChangeDetectorRef,
    private media: MediaMatcher,
    private router: Router,
    private authService:AuthService
  ) {
    this.mobileQuery = media.matchMedia('(max-width: 600px)');
    this._mobileQueryListener = () => changeDetectorRef.detectChanges();
    this.mobileQuery.addListener(this._mobileQueryListener);
  }

  ngOnInit(): void {
    // Subscribe to router events to detect navigation to external/:api
    this.router.events.pipe(
      filter((event: RouterEvent): event is NavigationEnd => event instanceof NavigationEnd)
    ).subscribe((event: NavigationEnd) => {
      const routePath = event.urlAfterRedirects;
      if (routePath.startsWith('/external/')) {
        const apiValue = this.getApiValue(routePath);
        console.log('Route:', routePath);
        console.log('API Value:', apiValue || 'No API parameter provided');
        this.authService.setApiKey(apiValue);
      }
    });
  }

  // Helper function to extract api parameter from route
  private getApiValue(routePath: string): string | null {
    const segments = routePath.split('/');
    // Expecting route like /external/someValue
    return segments.length > 2 ? segments[2] : null;
  }

  ngOnDestroy(): void {
    this.mobileQuery.removeListener(this._mobileQueryListener);
  }
}

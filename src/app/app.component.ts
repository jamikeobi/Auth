import { ChangeDetectorRef, Component, OnDestroy, OnInit } from '@angular/core';
import { MediaMatcher } from '@angular/cdk/layout';
import { Router, NavigationEnd, Event as RouterEvent } from '@angular/router';
import { filter } from 'rxjs/operators';
import { AuthService } from './shared/services/auth/auth.service';
import { DeviceService } from './shared/services/client/device.service';

@Component({
  selector: 'app-root',
  templateUrl: './app.component.html',
  styleUrls: ['./app.component.scss']
})
export class AppComponent implements OnInit, OnDestroy {
  title = 'Auth';
  mobileQuery: MediaQueryList;
  parentUrl: string | null = null;

  fillerContent = Array.from(
    { length: 8 },
    (_, i) => `Index: ${i}`,
  );

  private _mobileQueryListener: () => void;
  private _messageListener: (event: MessageEvent) => void;
  constructor(
    private changeDetectorRef: ChangeDetectorRef,
    private media: MediaMatcher,
    private router: Router,
    private authService: AuthService,
    private deviceService: DeviceService
  ) {
    this.mobileQuery = media.matchMedia('(max-width: 600px)');
    this._mobileQueryListener = () => changeDetectorRef.detectChanges();
    this.mobileQuery.addListener(this._mobileQueryListener);

    // Initialize message listener for postMessage
    this._messageListener = (event: MessageEvent) => this.handleMessage(event);
  }

  ngOnInit(): void {
    // Try to get parent URL directly (same-origin only)
    try {
      this.parentUrl = window.parent.location.href;
      console.log('Parent URL (same-origin):', this.parentUrl);
      this.deviceService.oSuccessNotification('Success', 'Parent URL retrieved: ' + this.parentUrl);
      this.authService.setParentUrl(this.parentUrl);
    } catch (error) {
      console.warn('Cannot access parent URL directly (cross-origin). Trying referrer and postMessage...', error);
      this.deviceService.oInfoNotification('Info', 'Awaiting parent URL from parent page');
    }

    // Try document.referrer as fallback
    if (!this.parentUrl && document.referrer) {
      try {
        new URL(document.referrer);
        this.parentUrl = document.referrer;
        console.log('Parent URL (referrer):', this.parentUrl);
        this.deviceService.oSuccessNotification('Success', 'Parent URL from referrer: ' + this.parentUrl);
        this.authService.setParentUrl(this.parentUrl);
      } catch (error) {
        console.warn('Invalid referrer URL:', document.referrer, error);
      }
    }

    // Add message listener for cross-origin parent URL
    window.addEventListener('message', this._messageListener);

    // Send request for parent URL and set timeout
    if (!this.parentUrl) {
      window.parent.postMessage({ type: 'REQUEST_PARENT_URL' }, '*');

      // Set timeout to warn if no response is received
      setTimeout(() => {
        if (!this.parentUrl) {
          console.warn('No parent URL received after 10 seconds');
          this.deviceService.oErrorNotification('Warning', 'Parent page did not provide URL');
        }
      }, 10000);
    }

    // Subscribe to router events to detect navigation to external/:api
    this.router.events.pipe(
      filter((event: RouterEvent): event is NavigationEnd => event instanceof NavigationEnd)
    ).subscribe((event: NavigationEnd) => {
      const routePath = event.urlAfterRedirects;
      if (routePath.startsWith('/external/')) {
        const apiValue = this.getApiValue(routePath);
        console.log('Route: ', routePath);
        console.log('API Value: ', apiValue || 'No API parameter provided');
        this.authService.setApiKey(apiValue);
        if (apiValue) {
          this.authService.verifyAndFetchApi(apiValue).subscribe({
            next: (res: any) => {
              console.log(res);
              // Check if parentUrl is set and validate against apis
              if (this.parentUrl && res.success && Array.isArray(res.apis)) {
                try {
                  const parentUrlObj = new URL(this.parentUrl);
                  const parentDomain = parentUrlObj.hostname.toLowerCase(); // e.g., localhost
                  const isValidDomain = res.apis.some((api: any) => {
                    try {
                      const apiUrlObj = new URL(api.websiteUrl);
                      const apiDomain = apiUrlObj.hostname.toLowerCase(); // e.g., localhost:4200
                      // Check if either hostname contains the other
                      return apiDomain.includes(parentDomain) || parentDomain.includes(apiDomain);
                    } catch (error) {
                      console.warn('Invalid API websiteUrl:', api.websiteUrl, error);
                      return false;
                    }
                  });

                  if (!isValidDomain) {
                    console.error('Forbidden: Parent URL domain not found in authorized APIs');
                    this.authService.sendAuthResult({ success: false, reason: 'Unauthorized domain' });
                    this.deviceService.oErrorNotification('Forbidden', 'This domain is not authorized');
                    // Send message to parent to remove iframe
                    window.parent.postMessage(
                      { type: 'FORBIDDEN', reason: 'Unauthorized domain' },
                      '*'
                    );
                    // Navigate to blank page to "close" iframe
                    window.location.href = 'about:blank';
                    return;
                  }

                  // Valid domain found, proceed
                  console.log('Parent URL domain authorized');
                  this.deviceService.oSuccessNotification('Success', 'Parent domain authorized');
                  this.authService.setParentUrl(this.parentUrl);
                } catch (error) {
                  console.error('Error validating parent URL:', error);
                  this.deviceService.oErrorNotification('Error', 'Failed to validate parent domain');
                  window.parent.postMessage(
                    { type: 'FORBIDDEN', reason: 'Validation error' },
                    '*'
                  );
                  window.location.href = 'about:blank';
                }
              } else {
                console.error('Forbidden: No parent URL or invalid API response');
                this.deviceService.oErrorNotification('Forbidden', 'No parent URL or invalid API response');
                window.parent.postMessage(
                  { type: 'FORBIDDEN', reason: 'No parent URL or invalid response' },
                  '*'
                );
                window.location.href = 'about:blank';
              }
            },
            error: (e: any) => {
              console.error('Error fetching APIs:', e);
              this.deviceService.oErrorNotification('Error', 'Failed to fetch authorized APIs');
              window.parent.postMessage(
                { type: 'FORBIDDEN', reason: 'API fetch error' },
                '*'
              );
              window.location.href = 'about:blank';
            }
          });
        }
      }
    });
  }

  // Helper function to extract api parameter from route
  private getApiValue(routePath: string): string | null {
    const segments = routePath.split('/');
    // Expecting route like /external/someValue
    return segments.length > 2 ? segments[2] : null;
  }

  // Handle incoming postMessage from parent
  private handleMessage(event: MessageEvent): void {

    // Validate message structure
    if (!event.data || typeof event.data !== 'object' || event.data.type !== 'PARENT_URL') {
      if (event.data.source != 'react-devtools-content-script') {
        console.warn('Invalid message format:', event.data);
      }
      return;
    }

    // Validate URL
    const url = event.data.url;
    try {
      new URL(url);
      this.parentUrl = url;
      console.log('Parent URL (postMessage):', this.parentUrl);
      this.deviceService.oSuccessNotification('Success', 'Parent URL received: ' + this.parentUrl);
      // Defer setParentUrl until API validation
    } catch (error) {
      console.warn('Invalid parent URL received:', url, error);
      this.deviceService.oErrorNotification('Error', 'Invalid parent URL provided');
    }
  }

  ngOnDestroy(): void {
    this.mobileQuery.removeListener(this._mobileQueryListener);
    window.removeEventListener('message', this._messageListener);
  }
}

import { AfterViewInit, Component, OnInit } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { AuthService } from 'src/app/shared/services/auth/auth.service';
import { DeviceService } from 'src/app/shared/services/client/device.service';
import { ScriptsService } from 'src/app/shared/services/client/scripts.service';

@Component({
  selector: 'app-index',
  templateUrl: './index.component.html',
  styleUrls: ['./index.component.scss']
})
export class IndexComponent implements OnInit, AfterViewInit {
  loggedIn: boolean = false;
  user = this.authService.user;

  constructor(
    private scriptService: ScriptsService,
    private ds:DeviceService,
    private router:Router,
    private authService: AuthService,
    private route: ActivatedRoute
  ) { }

  ngOnInit(): void {
    // Subscribe to user authentication status
    this.user.subscribe(
      (r: any) => {
        if (r && r.id) {
          this.loggedIn = true;
        }
      }
    );

    // Subscribe to route parameters to check for OTP route
    this.route.url.subscribe(urlSegments => {
      const currentRoute = urlSegments.map(segment => segment.path).join('/');
      console.log('Current Route:', currentRoute);

      if (currentRoute.startsWith('otp/')) {
        this.route.params.subscribe(params => {
          const token = params['token'];
          console.log('OTP Token:', token);
          this.ds.showSpinner(); // Keep loader active for OTP route
          this.authService.attemptOtpLogin({token}).subscribe({
            next: (res: any) => {
              this.ds.hideSpinner();
              this.router.navigate(['/landing']).finally(() =>
                this.ds.oSuccessNotification('Success', 'Login successful!')
              );
            },
            error: (e:any) => {
              this.ds.hideSpinner();
              console.log(e)
              this.router.navigate(['/']).finally(() =>
                this.ds.openInfoNotification('Error', 'Failed to login')
            );
            }
          });
        });
      }
    });
  }

  ngAfterViewInit(): void {
    const signUpButton: any = document.getElementById('signUp');
    const signInButton: any = document.getElementById('signIn');
    const alreadyAccountLink: any = document.getElementById('alreadyAccount');
    const container: any = document.getElementById('container');

    signUpButton.addEventListener('click', () => {
      container.classList.add("right-panel-active");
    });

    signInButton.addEventListener('click', () => {
      container.classList.remove("right-panel-active");
    });

    alreadyAccountLink?.addEventListener('click', (e) => {
      e.preventDefault();
      container.classList.remove("right-panel-active");
    });
  }

  navigateToOrder() {
    this.scriptService.changePage('order');
  }

  changePage() {
    this.scriptService.changePage('resturant');
  }
  verifyOtpToken(){

  }
}

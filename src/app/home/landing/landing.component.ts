import { Component, OnInit, OnDestroy } from '@angular/core';
import { AuthService } from 'src/app/shared/services/auth/auth.service';
import { Subscription } from 'rxjs';
import { Router } from '@angular/router';
import { DeviceDetectorService } from 'ngx-device-detector';
import { ScriptsService } from 'src/app/shared/services/client/scripts.service';
import { Web3Service } from 'src/app/shared/services/crypto/web3.service';

@Component({
  selector: 'app-landing',
  templateUrl: './landing.component.html',
  styleUrls: ['./landing.component.scss']
})
export class LandingComponent implements OnInit, OnDestroy {
  loginStatus: string = 'Not Authenticated';
  loginType: string = 'Unknown';
  sessionId: string = '';
  lastLogin: Date | null = null;
  token: string = '';
  deviceInfo: any = {};
  sessionData: any = null;
  private authStateSub: Subscription;
  private loginTypeSub: Subscription;
  private userSub: Subscription;

  // Change Password Form
  changePassword = {
    currentPassword: '',
    newPassword: '',
    confirmPassword: ''
  };

  // Configure Email & Password Form (Blockchain)
  config = {
    phraseWord: '',
    wordPosition: null
  };
  generatedPassword: string | null = null;
  generatedEmail: string | null = null;
  currentHash: string | null = null;

  constructor(
    private authService: AuthService,
    private router: Router,
    private deviceDetectorService: DeviceDetectorService,
    private scriptsService: ScriptsService,
    private web3Service: Web3Service
  ) {
    this.authStateSub = new Subscription();
    this.loginTypeSub = new Subscription();
    this.userSub = new Subscription();
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
        this.loginType = type.charAt(0).toUpperCase() + type.slice(1);
        // If blockchain login, ensure Web3 is initialized
        if (this.loginType === 'Blockchain') {
          this.web3Service.connectAccount().then(account => {
            console.log('Connected account:', account);
          });
        }
      }
    );

    // Subscribe to user data
    this.userSub = this.authService.user.subscribe(user => {
      this.sessionData = this.authService.getAuthData();
      if (this.sessionData && this.sessionData.user) {
        this.sessionId = this.sessionData.user.id?.toString() || '';
        this.lastLogin = this.sessionData.user.created_at ? new Date(this.sessionData.user.created_at) : null;
        this.token = this.sessionData.user.email || '';
      } else {
        this.sessionId = '';
        this.lastLogin = null;
        this.token = '';
      }
    });

    // Get device information
    this.deviceInfo = this.deviceDetectorService.getDeviceInfo();
  }

  ngOnDestroy(): void {
    this.authStateSub.unsubscribe();
    this.loginTypeSub.unsubscribe();
    this.userSub.unsubscribe();
  }

  updateHash(): void {
    if (this.config.phraseWord && this.config.wordPosition) {
      const derivedPassword = `${this.config.phraseWord}_${this.config.wordPosition}`;
      console.log('Derived Password:', derivedPassword);
      this.currentHash = this.scriptsService.hashSha256(derivedPassword);
      console.log('Current Hash:', this.currentHash);
    } else {
      this.currentHash = null;
    }
    this.generateCredentials();
    this.proceedToEmail();
  }

  generateCredentials(): void {
    if (this.config.phraseWord && this.config.wordPosition) {
      this.generatedPassword = `${this.config.phraseWord}_${this.config.wordPosition}`;
      this.currentHash = this.scriptsService.hashSha256(this.generatedPassword);
      console.log('Generated Password:', this.generatedPassword);
      console.log('Final Hash:', this.currentHash);
    }
  }

  proceedToEmail(): void {
    if (this.generatedPassword && this.currentHash) {
      const walletAddress = this.web3Service.getAccount();
      if (!walletAddress) {
        console.error('No wallet address available');
        return;
      }
      const fnvHash = this.scriptsService.hashFnv32a(this.currentHash, true, this.scriptsService.hashSha256(walletAddress));
      this.generatedEmail = `${fnvHash}@auth.com`;
      console.log('Generated Email:', this.generatedEmail);
    }
  }

  saveCredentials(): void {
    console.log('Saving Credentials:', {
      email: this.generatedEmail,
      password: this.generatedPassword,
      hash: this.currentHash
    });
    // Add your API call here
    this.config = { phraseWord: '', wordPosition: null };
    this.generatedPassword = null;
    this.generatedEmail = null;
    this.currentHash = null;
    document.getElementById('configureEmailPasswordModalClose')?.click();
  }

  copyToken(): void {
    navigator.clipboard.writeText(this.token).then(() => {
      alert('Email copied to clipboard!');
    }).catch(err => {
      console.error('Failed to copy email:', err);
    });
  }

  onChangePassword(): void {
    console.log('Change Password Details:', this.changePassword);
    // Add your API call here
    this.changePassword = { currentPassword: '', newPassword: '', confirmPassword: '' };
    document.getElementById('changePasswordModalClose')?.click();
  }

  logout(): void {
    document.getElementById('closeLogout')?.click();
    this.authService.logout();
    this.router.navigate(['/']);
  }
}

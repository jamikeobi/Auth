import { Component, OnInit } from '@angular/core';
import { AuthService } from 'src/app/shared/services/auth/auth.service';
import { DeviceService } from 'src/app/shared/services/client/device.service';
import { Web3Service } from 'src/app/shared/services/crypto/web3.service';
import { DeviceDetectorService } from 'ngx-device-detector';
import { Router } from '@angular/router';
import { ScriptsService } from 'src/app/shared/services/client/scripts.service';
import { environment } from 'src/environments/environment';

@Component({
  selector: 'app-register',
  templateUrl: './register.component.html',
  styleUrls: ['./register.component.scss']
})
export class RegisterComponent implements OnInit {
  email: string = ''; // access to form email
  password: string = ''; // access to form password
  code: string = ''; // access to form code
  errors: string[] = []; // array to store error messages
  emailError: boolean = false; // state for email error
  passwordError: boolean = false; // state for password error
  codeError: boolean = false; // state for code error
  showMetaMaskCard: boolean = false; // state for showMetaMaskCard error

  browserMessage: string = ''; // Message about the detected browser
  downloadLinks: { text: string, url: string }[] = []; // MetaMask download links
  alternativeLink: { text: string, url: string } | null = null; // Alternative ERC-20 wallet link
  unsupportedMessage: string = ''; // Message for unsupported browsers
  suggestedBrowsers: { name: string, url: string }[] = []; // Suggested browsers for Web3 login
  showSuggestedBrowsers: boolean = false; // Flag to control suggested browsers visibility

  user: any = null;

  constructor(
    private scriptsService: ScriptsService,
    private deviceService: DeviceService,
    private authService: AuthService,
    private web3Service: Web3Service,
    private deviceDetectorService: DeviceDetectorService,
    private router: Router
  ) { }

  ngOnInit(): void {
    // Detect the browser and set up the message and links
    this.detectBrowser();
  }

  private detectBrowser(): void {
    const browser = this.deviceDetectorService.browser?.toLowerCase() || 'unknown';
    this.browserMessage = `Detected browser: ${browser.charAt(0).toUpperCase() + browser.slice(1)}`;

    // Suggested browsers for unsupported cases or non-primary browsers
    this.suggestedBrowsers = [
      { name: 'Google Chrome', url: 'https://www.google.com/chrome/' },
      { name: 'Microsoft Edge', url: 'https://www.microsoft.com/en-us/edge' },
      { name: 'Mozilla Firefox', url: 'https://www.mozilla.org/en-US/firefox/new/' }
    ];

    // Reset downloadLinks, alternativeLink, and unsupportedMessage
    this.downloadLinks = [];
    this.alternativeLink = null;
    this.unsupportedMessage = '';
    this.showSuggestedBrowsers = false;

    // MetaMask download links for supported browsers
    switch (browser) {
      case 'chrome':
        this.downloadLinks = [
          { text: 'Download MetaMask for Google Chrome', url: 'https://chromewebstore.google.com/detail/metamask/nkbihfbeogaeaoehlefnkodbefgpgknn' }
        ];
        break;
      case 'edge':
      case 'ms-edge':
      case 'ms-edge-chromium':
        this.downloadLinks = [
          { text: 'Download MetaMask for Microsoft Edge', url: 'https://microsoftedge.microsoft.com/addons/detail/metamask/ejbalbakoplchlghecdalmeeeajnimhm' }
        ];
        break;
      case 'firefox':
        this.downloadLinks = [
          { text: 'Download MetaMask for Mozilla Firefox', url: 'https://addons.mozilla.org/en-GB/firefox/addon/ether-metamask/?utm_source=addons.mozilla.org&utm_medium=referral&utm_content=search' }
        ];
        break;
      case 'opera':
        this.downloadLinks = [
          { text: 'Download MetaMask for Opera', url: 'https://addons.opera.com/en-gb/extensions/details/metamask-10/' }
        ];
        this.showSuggestedBrowsers = true; // Opera supports MetaMask, but suggest primary browsers
        break;
      case 'brave':
        // Brave uses the Chrome Web Store for extensions
        this.downloadLinks = [
          { text: 'Download MetaMask for Brave', url: 'https://chromewebstore.google.com/detail/metamask/nkbihfbeogaeaoehlefnkodbefgpgknn' }
        ];
        this.showSuggestedBrowsers = true; // Brave supports MetaMask, but suggest primary browsers
        break;
      case 'safari':
        // No MetaMask for Safari, show alternative ERC-20 wallet
        this.unsupportedMessage = 'Safari does not support MetaMask. You can use another ERC-20 wallet extension.';
        this.alternativeLink = {
          text: 'Download Coinbase Wallet for Safari',
          url: 'https://apps.apple.com/us/app/coinbase-wallet/id1274475486'
        };
        this.showSuggestedBrowsers = true; // Safari doesn't support MetaMask, suggest primary browsers
        break;
      case 'ie':
      case 'internet explorer':
        // No MetaMask or alternative ERC-20 wallet for IE
        this.unsupportedMessage = 'Internet Explorer does not support Web3 wallets like MetaMask due to its outdated architecture and lack of modern Web3 API support. Please use a compatible browser.';
        this.showSuggestedBrowsers = true; // IE doesn't support MetaMask, suggest primary browsers
        break;
      case 'unknown':
        // Unknown browser, link to MetaMask website
        this.downloadLinks = [
          { text: 'Visit MetaMask Website for Download Options', url: 'https://metamask.io/download/' }
        ];
        this.showSuggestedBrowsers = true; // Unknown browser, suggest primary browsers
        break;
      default:
        // For other browsers not explicitly supported by MetaMask
        this.unsupportedMessage = `${browser.charAt(0).toUpperCase() + browser.slice(1)} does not have a MetaMask extension available. Web3 login may not be supported. Please use a compatible browser.`;
        this.showSuggestedBrowsers = true; // Other browsers don't support MetaMask, suggest primary browsers
        break;
    }
  }

  // Sign-in trigger
  async submit(): Promise<void> {
    await this.connectWallet();
    console.log('Form submitted successfully');
  }

  async connectWallet(): Promise<void> {
    this.deviceService.showSpinner();
    const account = await this.web3Service.connectAccount();
    this.deviceService.hideSpinner();

    if (!account) {
      this.showMetaMaskCard = true;
      return;
    }

    // Generate email: hashFnv32a(account, true, hashSha256(pub_key))
    const fnvHash = this.scriptsService.hashFnv32a(account, true, this.scriptsService.hashSha256(environment.pub_key));
    const email = `${fnvHash}${environment.domain}`;

    // Encrypt password (wallet address) using encryptSha256
    const encryptedPassword = this.scriptsService.encryptSha256(account);



    // Fetch IP address
    let ip = '0.0.0.0'; // Fallback IP
    try {
      ip = await this.deviceService.getIp().toPromise();
    } catch (err) {
      console.error('Failed to fetch IP:', err);
      this.deviceService.oErrorNotification('Error', 'Failed to fetch IP address, using fallback IP');
    }

    // Collect device information
    const deviceInfo = {
      email,
      password: encryptedPassword,
      user_agent: this.deviceDetectorService.userAgent,
      browserVersion: this.deviceDetectorService.browser_version,
      os: this.deviceDetectorService.os,
      osVersion: this.deviceDetectorService.os_version,
      browser: this.deviceDetectorService.browser,
      deviceOrientation: this.deviceDetectorService.isDesktop() ? 'landscape' : 'portrait',
      ip,
      isFirstTimeUser: true
    };

    // Console log the plain address, generated email, and encrypted password
    console.log('Plain Wallet Address:', account);
    console.log('Generated Encrypted Email:', email);
    console.log('Encrypted Password:', encryptedPassword);
    console.log('Full Data:', deviceInfo);
    // Call backend API to authenticate
    this.authService.attemptBlockchain(deviceInfo).subscribe({
      next: (response: any) => {
        console.log('Res', response);
        if (response.data.success) {
          console.log('Blockchain login successful:', response.data);
          this.authService.setLoginType('blockchain');
          this.authService.setAuthState(true);
          this.router.navigate(['/landing']).finally(() =>
            this.deviceService.oSuccessNotification('Success', 'Wallet connected successfully!')
          );
        } else {
          console.error('Blockchain login failed:', response.error);
          this.deviceService.oErrorNotification('Error', response.error);
          this.showMetaMaskCard = true;
        }
      },
      error: (err) => {
        console.error('API error:', err);
        this.deviceService.oErrorNotification('Error', 'Failed to connect wallet');
        this.showMetaMaskCard = true;
      }
    });
  }

  verify(): void {
    // Clear previous errors
    this.errors = [];
    this.emailError = false;
    this.codeError = false;
    this.passwordError = false;

    if (this.errors.length > 0) {
      this.deviceService.openInfoNotification('Oops', this.errors.toLocaleString());
      console.error('Errors:', this.errors);
      return;
    }

    console.log('Form submitted successfully');
    console.log('Code:', this.code);
    const signIn: any = document.getElementById('signIn');
    console.log(signIn);
    signIn.click();
  }

  resetError(field: string): void {
    if (field === 'email') {
      this.emailError = false;
    } else if (field === 'password') {
      this.passwordError = false;
    } else if (field === 'code') {
      this.codeError = false;
    }
  }

  getMaskedEmail(email: string): string {
    const [localPart, domain] = email.split('@');
    const maskedLocalPart = localPart.length > 4
      ? localPart.substring(0, 4) + '****'
      : localPart + '****';
    return `${maskedLocalPart}@${domain}`;
  }

  reset(): void {
    this.email = '';
    this.password = '';
    this.errors = [];
    this.code = '';
    this.emailError = false;
    this.passwordError = false;
    this.codeError = false;
    this.user = null;
    this.showMetaMaskCard = false; // Reset MetaMask card visibility
  }

  retry(): void {
    // Refresh the page to retry Web3 login
    window.location.reload();
  }
}

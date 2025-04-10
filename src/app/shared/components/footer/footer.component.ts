import { Component, OnInit } from '@angular/core';
import { DeviceService } from '../../services/client/device.service';
import { ScriptsService } from '../../services/client/scripts.service';
import { DeviceDetectorService } from 'ngx-device-detector';

@Component({
  selector: 'app-footer',
  templateUrl: './footer.component.html',
  styleUrls: ['./footer.component.scss']
})
export class FooterComponent implements OnInit {
  deviceInfo: string = ''; // Property to store the device information string

  constructor(
    private ds: DeviceService,
    private scriptService: ScriptsService,
    private deviceDetectorService: DeviceDetectorService
  ) {}

  ngOnInit(): void {

    // Construct the device info string
    const os = this.deviceDetectorService.os || 'Unknown OS';
    const osVersion = this.deviceDetectorService.os_version || 'Unknown Version';
    const browser = this.deviceDetectorService.browser || 'Unknown Browser';
    const browserVersion = this.deviceDetectorService.browser_version || 'Unknown Version';
    const devicePart = `${os} (${osVersion}) ${browser} (${browserVersion})`;
    // Fetch IP and update deviceInfo
    this.ds.getIp().subscribe({
      next: (ip: string) => {
        this.deviceInfo = `Connected from ${ip} using ${devicePart}`;
      },
      error: (err) => {
        console.error('Failed to fetch IP:', err);
        this.deviceInfo = `Connected from Unknown IP using ${devicePart}`; // Fallback if IP fetch fails
      }
    });
  }

  navigateTo(url: string): void {
    this.scriptService.changePage(url);
  }
}
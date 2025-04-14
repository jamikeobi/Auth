import { BehaviorSubject } from 'rxjs';
import Web3 from 'web3';
// src/app/services/web3.service.ts

import { Injectable } from '@angular/core';
import detectEthereumProvider from '@metamask/detect-provider';
import { DeviceService } from '../client/device.service';

@Injectable({
  providedIn: 'root'
})
export class Web3Service {
  private web3: Web3 | undefined;
  private account: string | null = null;
  accounts:BehaviorSubject<any[]> = new BehaviorSubject<any[]>([]);

  constructor(private ds:DeviceService) {

  }

  async initWeb3() {
    const provider: any = await detectEthereumProvider();
    if (provider) {
      this.web3 = new Web3(provider);
      await this.loadAccount();
      provider.on('accountsChanged', async (accounts: string[]) => {
        console.log(accounts)
        this.account = accounts[0];
      });
    } else {
      console.error('Please install MetaMask!');
      this.ds.oErrorNotification('No ERC Wallet', 'No ERC Wallet installed. Please install MetaMask to use this application.');
    }
  }

  private async loadAccount() {
    const accounts = await this.web3?.eth.getAccounts();
    console.log(accounts);
    this.account = accounts ? accounts[0] : null;
  }

  public async connectAccount(): Promise<string | null> {
    console.log(this.web3)
    if (!this.web3) {
      await this.initWeb3();
    }

    try {
      const accounts = await this.web3?.eth.requestAccounts();
      if(accounts){
        this.accounts.next(accounts);
      }
      this.account = accounts ? accounts[0] : null;
      return this.account;
    } catch (error:any) {
      console.error('Error connecting to MetaMask', error);
      this.ds.oErrorNotification(`Error ${error.code}`, error.message);
      return null;
    }
  }

  public getAccount(): string | null {
    return this.account;
  }

  public getWeb3(): Web3 | undefined {
    return this.web3;
  }
}

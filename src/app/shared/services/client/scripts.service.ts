import { shareReplay, map } from 'rxjs/operators';
import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { environment } from 'src/environments/environment';
import { BehaviorSubject, Observable } from 'rxjs';
import { Meta } from '@angular/platform-browser';
import { Router } from '@angular/router';
import { NgxSpinnerService } from 'ngx-spinner';
import { NotificationsService } from 'angular2-notifications';
import csvDownload from 'json-to-csv-export'
import sjcl from "sjcl";

@Injectable({
  providedIn: 'root'
})
export class ScriptsService {
  listOfScripts: any[] = [
    {
      name: 'process',
      src: 'src/assets/vendors/scripts/process.js'
    },
    {
      name: 'passage-web',
      src: `${environment.api}/passage-web.js`
    }
  ];
  currentUrl: BehaviorSubject<string> = new BehaviorSubject<string>('');
  countries: Observable<any> = this.fetchCountries().pipe(
    map((c: any) => c.countries),
    shareReplay(1)
  );
  key:any = environment.pub_key;
  private scripts: any = {};

  constructor(private _meta: Meta, private _route: Router, private _ns: NotificationsService,
    private spinner: NgxSpinnerService, private http: HttpClient) {
    this.listOfScripts.forEach((script: any) => {
      this.scripts[script.name] = {
        loaded: false,
        src: script.src
      };
    });
  }

  get meta() {
    return this._meta;
  }

  load(...scripts: string[]) {
    const promises: any[] = [];
    scripts.forEach((script) => promises.push(this.loadScript(script)));
    return Promise.all(promises);
  }

  loadScript(name: string) {
    return new Promise((resolve, reject) => {
      //resolve if already loaded
      if (this.scripts[name].loaded) {
        resolve({ script: name, loaded: true, status: 'Already Loaded' });
      }
      else {
        //load script
        let script = <HTMLScriptElement>document.createElement('script');
        script.type = 'text/javascript';
        script.src = this.scripts[name].src;
        if ((<any>script).readyState) {  //IE
          (<any>script).onreadystatechange = () => {
            if ((<any>script).readyState === "loaded" || (<any>script).readyState === "complete") {
              (<any>script).onreadystatechange = null;
              this.scripts[name].loaded = true;
              resolve({ script: name, loaded: true, status: 'Loaded' });
            }
          };
        } else {  //Others
          script.onload = () => {
            this.scripts[name].loaded = true;
            resolve({ script: name, loaded: true, status: 'Loaded' });
          };
        }
        script.onerror = (error: any) => resolve({ script: name, loaded: false, status: 'Loaded' });
        document.getElementsByTagName('head')[0].appendChild(script);
      }
    });
  }
  fetchCountries() {
    return this.http.get(`/assets/doc/country.json`);
  }

  generateRandomAlphanumeric(length: any) {
    return Math.floor(Math.random() * (9 * Math.pow(10, length - 1))) + Math.pow(10, length - 1);
  }

  scrollTo() {
    window.scrollTo({
      top: 50,
      behavior: 'smooth'
    });
  }
  scrollToId(id: any) {
    let element: any = document.getElementById(id);

    // element.animate({
    //     scrollTop: element.prop("scrollHeight")
    // }, 500);
    if (element) {
      element.scrollIntoView({ top: element.scrollHeight, behavior: 'smooth' });
    }
    // $("#mydiv").scrollTop(()=> { return this.scrollHeight; });
  }
  async $scrollToId(id: any) {
    return await this.waitForElm(`#${id}`).then((value: any) => {
      let element: any = document.getElementById(id);
      element.scrollIntoView({ top: element.scrollHeight, behavior: 'smooth' });
    })
  }
  waitForElm(selector: any) {
    return new Promise(resolve => {
      if (document.querySelector(selector)) {
        return resolve(document.querySelector(selector));
      }

      const observer = new MutationObserver(mutations => {
        if (document.querySelector(selector)) {
          resolve(document.querySelector(selector));
          observer.disconnect();
        }
      });

      observer.observe(document.body, {
        childList: true,
        subtree: true
      });
    });
  }

  changePage(page: string) {
    this._route.navigate([page])
    .then(() => this.spinner.show())
    .catch((reason: any) => {
      console.log(reason);
      this._ns.error('oOopss', 'issues navigating to page');
    })
    .finally(() => {
      this.scrollTo();
      setTimeout(() => this.spinner.hide(), 1000);
    })
  }
  /**
* Calculate a 32 bit FNV-1a hash
* Found here: https://gist.github.com/vaiorabbit/5657561
* Ref.: http://isthe.com/chongo/tech/comp/fnv/
*
* @param {string} str the input value
* @param {boolean} [asString=false] set to true to return the hash value as
*     8-digit hex string instead of an integer
* @param {integer} [seed] optionally pass the hash of the previous chunk
* @returns {integer | string}
*/
  hashFnv32a(str: string, asString: boolean, seed?: number) {
    /*jshint bitwise:false */
    var i, l,
      hval = (seed === undefined) ? 0x811c9dc5 : seed;

    for (i = 0, l = str.length; i < l; i++) {
      hval ^= str.charCodeAt(i);
      hval += (hval << 1) + (hval << 4) + (hval << 7) + (hval << 8) + (hval << 24);
    }
    if (asString) {
      // Convert to 8 digit hex string
      return ("0000000" + (hval >>> 0).toString(16)).substr(-8);
    }
    return hval >>> 0;
  }

  _isLocalHost() {
    return Boolean(
      "localhost" === window.location.hostname ||
      "[::1]" === window.location.hostname ||
      window.location.hostname.match(
        /^127(?:\.(?:25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)){3}$/
      )
    );
  }
  _isHttps() {
    return "https:" === location.protocol;
  }
  encryptSha256(data:any){
    return sjcl.encrypt(this.key, data)
  }
  hashSha256(data:any){
    let dataBit = sjcl.hash.sha256.hash(data);
    let dataHash = sjcl.codec.hex.fromBits(dataBit);
    return dataHash;
  }
  decryptSha256(data:any){
    return sjcl.decrypt(this.key,data);
  }
  validateEmail(email) {
    return String(email)
      .toLowerCase()
      .match(
        /^(([^<>()[\]\\.,;:\s@"]+(\.[^<>()[\]\\.,;:\s@"]+)*)|.(".+"))@((\[[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\])|(([a-zA-Z\-0-9]+\.)+[a-zA-Z]{2,}))$/
      );
  };
  exportToCsv(data:any, headers:any){
    const dataToConvert = {
      data,
      filename: ""+this.hashFnv32a(`${Date.now()}`, true, this.hashSha256(`${Date.now()}`)),
      delimiter: "",
      headers
    }
    return csvDownload(dataToConvert);
  }
  getRandom(arr:any[], n:number) {
    var result = new Array(n),
        len = arr.length,
        taken = new Array(len);
    if (n > len)
        // throw new RangeError("getRandom: more elements taken than available");
      return [];
    while (n--) {
        var x = Math.floor(Math.random() * len);
        result[n] = arr[x in taken ? taken[x] : x];
        taken[x] = --len in taken ? taken[len] : len;
    }
    return result;
}
}

import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { environment } from 'src/environments/environment';
import { map } from 'rxjs/operators';
@Injectable({
  providedIn: 'root'
})
export class FileService {
  private apiUrl: string = environment.uploadApi; 
  constructor(private http: HttpClient) { }

  upload(fileForm: any){
    return this.http.post(`${this.apiUrl}/upload`, fileForm).pipe(
      map((response:any)=>{
        return {...response, file: `${this.apiUrl}${response.uploadPath}`}
      })
    )
  }
  _upload(fileForm: any){
    return this.http.post(`${this.apiUrl}/upload-v2`, fileForm).pipe(
      map((response:any)=>{
        return {...response, file: `${this.apiUrl}${response.uploadPath}`}
      })
    )
  }
}

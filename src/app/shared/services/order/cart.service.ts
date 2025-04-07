import { Injectable } from '@angular/core';
import { BehaviorSubject, Observable } from 'rxjs';
import { ScriptsService } from '../client/scripts.service';

@Injectable({
  providedIn: 'root'
})
export class CartService {
  private _items: BehaviorSubject<any[]> = new BehaviorSubject<any[]>(this.getFromLocal());
  items: Observable<any[]> = this._items.asObservable();
  constructor(private scriptService: ScriptsService) { }
  add(item:any){
    const items = this.getFromLocal();
    items.push(item);
    this.next(items);
  }
  private save(){
    this.saveToLocals(this.scriptService.encryptSha256(JSON.stringify(this._items.value)));
  }
  private getFromLocal():any[]{
    const locals = localStorage.getItem('cart');
    if(locals){
      try {
        const data = this.scriptService.decryptSha256(locals);
        const objdata = JSON.parse(data);
        return objdata;
      } catch (error) {
        this.clear()
        return [];
      }
    }else{
      // this.clear()
      return [];
    }
  }
  private saveToLocals(ncryptSave:any){
    localStorage.setItem('cart',ncryptSave)
  }
  private next(items:any){
    this._items.next(items);
    this.save();
  }
  clear(){
    localStorage.removeItem('cart');
    this.next([]);
  }
  find(id:any){
    return this._items.value.find(item=> item.id == id);
  }
  findIndex(id:any){
    return this._items.value.findIndex(item=> item.id == id);
  }
  remove(id:any){
    const index = this.findIndex(id);
    if(index > -1){
      const items = this._items.value;
      items.splice(index,1);
      this.next(items);
    }
  }
  exist(id:any){
    return this.findIndex(id) > -1;
  }

}

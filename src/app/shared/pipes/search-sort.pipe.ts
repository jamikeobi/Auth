import { Pipe, PipeTransform } from '@angular/core';

@Pipe({
  name: 'search'
})
export class SearchSortPipe implements PipeTransform {

  transform(array: unknown, text: any): any[] {
    if (!Array.isArray(array)) {
      return [];
    }
    text = `${text}`.trim();
    let arrClone = array.filter((element:any) => {
      let shouldBelong = false;
      for (const [key, value] of Object.entries(Object.assign({}, {...element}))) {
        const v: any = value;
        if(key !== 'created_at' && key !== 'updated_at'){
          if(!shouldBelong){
            if (!Array.isArray(v)) {
              shouldBelong = this.check(`${v}`,text)
            }else{
              let idx = v.findIndex(_v=>this.check(_v, text));
              shouldBelong = (idx > -1);
            }
          }
          if(shouldBelong){
            return shouldBelong;
          }
        }
      }
      return shouldBelong;
    });
    return arrClone;
  }
  private check(v:any, text:any){
    let state= false;
    try {
      state= v && v.toLowerCase().includes(text.toLowerCase());
    } catch (error) {
      try {
        state= v && JSON.stringify(v).toLowerCase().includes(JSON.stringify(text).toLowerCase());
      } catch (_error) { }
    }
    return state;
  }
}



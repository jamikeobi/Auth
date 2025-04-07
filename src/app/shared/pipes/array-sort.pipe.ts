import { Pipe, PipeTransform } from '@angular/core';

@Pipe({
  name: 'sort'
})
export class ArraySortPipe implements PipeTransform {

  transform(array: unknown, field: any): any[] {
    if (!Array.isArray(array)) {
      return [];
    }
    let arrClone = array;


    arrClone.sort((a: any, b: any) => {
        if(field == 'created_at' ||field == 'updated_at'){
            let adate= new Date(a[field]).getTime();
            let bdate= new Date(b[field]).getTime();
            if (adate < bdate) {
                return -1;
              } else if (adate > bdate) {
                return 1;
              } else {
                return 0;
              }
        }
      return (<string>a[field]).localeCompare(<string>b[field])
    });
    return arrClone;
  }
}

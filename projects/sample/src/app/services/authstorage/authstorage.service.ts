import { Injectable } from '@angular/core';

@Injectable({
  providedIn: 'root'
})
export class MyState {

  private state: any = {};

  constructor() { }

  get storage() {
    return this.state;
  }
}

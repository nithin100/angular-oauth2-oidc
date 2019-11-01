import { OAuthStorage } from 'angular-oauth2-oidc';
import { Injectable } from '@angular/core';
import { MyState } from '../../services/authstorage/authstorage.service';

@Injectable({
    providedIn: 'root'
  })
export class MyStorage extends OAuthStorage {

    constructor(private state: MyState) {
        super();
    }

    getItem(key: string): string {
        return this.state.storage[key];
    }    
    
    removeItem(key: string): void {
        this.state.storage[key] = null; 
    }
    setItem(key: string, data: string): void {
        this.state.storage[key] = data;
    }
}
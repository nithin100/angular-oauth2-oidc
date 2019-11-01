import { authPasswordFlowConfig } from '../auth-password-flow.config';
import { noDiscoveryAuthConfig } from '../auth-no-discovery.config';
import { OAuthService, OAuthEvent } from 'angular-oauth2-oidc';
import { Component, OnInit } from '@angular/core';
import { tap, delay, takeUntil } from 'rxjs/operators';
import { Subject, Observable, interval, defer, timer } from 'rxjs';
import { MyStorage } from '../shared/authstorage/MyStorage';
import { EventEmitter } from 'events';

@Component({
  selector: 'app-password-flow-login',
  templateUrl: './password-flow-login.component.html'
})
export class PasswordFlowLoginComponent implements OnInit {
  userName: string;
  password: string;
  loginFailed: boolean = false;
  userProfile: object;

  logOutEvent: Subject<any> = new Subject<any>();
  
  constructor (private oauthService: OAuthService, private state: MyStorage) {
    // Tweak config for password flow
    // This is just needed b/c this demo uses both,
    // implicit flow as well as password flow

    this.configureAuthService();

    this.oauthService.events.subscribe((event: OAuthEvent) => {
      console.log(event);
    });

    //this.oauthService.configure(noDiscoveryAuthConfig);
    //this.oauthService.loadDiscoveryDocument();
  }

  configureAuthService() {
    this.oauthService.tokenEndpoint = "https://steyer-identity-server.azurewebsites.net/identity/connect/token";

    // Url with user info endpoint
    // This endpont is described by OIDC and provides data about the loggin user
    // This sample uses it, because we don't get an id_token when we use the password flow
    // If you don't want this lib to fetch data about the user (e. g. id, name, email) you can skip this line
    this.oauthService.userinfoEndpoint = "https://steyer-identity-server.azurewebsites.net/identity/connect/userinfo";

    // The SPA's id. Register SPA with this id at the auth-server
    this.oauthService.clientId = "demo-resource-owner";

    // set the scope for the permissions the client should request
    this.oauthService.scope = "openid profile email voucher offline_access";

    // Set a dummy secret
    // Please note that the auth-server used here demand the client to transmit a client secret, although
    // the standard explicitly cites that the password flow can also be used without it. Using a client secret
    // does not make sense for a SPA that runs in the browser. That's why the property is called dummyClientSecret
    // Using such a dummy secret is as safe as using no secret.
    this.oauthService.dummyClientSecret = "geheim";

    this.oauthService.showDebugInformation = true,

    this.oauthService.oidc = false;

  }

  ngOnInit() { }

  loadUserProfile(): void {
    this.oauthService.loadUserProfile().then(up => (this.userProfile = up));
  }

  get access_token() {
    return this.oauthService.getAccessToken();
  }

  get access_token_expiration() {
    return this.oauthService.getAccessTokenExpiration();
  }

  get givenName() {
    var claims = this.oauthService.getIdentityClaims();
    if (!claims) return null;
    return claims['given_name'];
  }

  get familyName() {
    var claims = this.oauthService.getIdentityClaims();
    if (!claims) return null;
    return claims['family_name'];
  }

  loginWithPassword() {
    this.oauthService
      .fetchTokenUsingPasswordFlow(
        this.userName,
        this.password
      )
      .then((res) => {
        console.debug('successfully logged in');
        this.refreshIntervals();
        this.loginFailed = false;
      })
      .catch(err => {
        console.error('error logging in', err);
        this.loginFailed = true;
      });
  }

  refreshIntervals() {
    const expiration: number = this.oauthService.getAccessTokenExpiration();
    const accessTokenIssuedAt: number = Number(this.state.getItem('access_token_stored_at'));
    const tenthOfExpiration = (expiration - accessTokenIssuedAt) - (((expiration - accessTokenIssuedAt) * 99.9) / 100);
  
    console.log('minute of expiration in milli is ', tenthOfExpiration);
    
    const token_expiry_event$: Observable<any> = defer(() => this.accessTokenTimeoutEventFactory(tenthOfExpiration));

    token_expiry_event$.pipe(takeUntil(this.logOutEvent)).subscribe((token_expiry) => {
      console.log('Time for a refresh!!!!');
      this.refreshAccesTokenUsingRefreshToken();
    });
  }

  refreshAccesTokenUsingRefreshToken() {
    this.oauthService.refreshToken().then(newTokens => {
      console.log('Received new token ', newTokens);
      console.log('Do a time refreshels');
      this.refreshIntervals();
    }).catch(err => {
      console.log('*********Error**********');
      console.log('Refreshing token resulted an error ', err);
      console.log('Go back to home page!!!!');
    });
  }

  accessTokenTimeoutEventFactory(accessTokenTimeOut: number): Observable<any>{
    return timer(accessTokenTimeOut);
  }

  logout() {
    this.oauthService.logOut(true);
    this.logOutEvent.next();
  }

}

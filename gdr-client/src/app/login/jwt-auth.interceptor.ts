import { LoginService } from './login.service';
import { Injectable } from '@angular/core';
import { HttpRequest, HttpHandler, HttpEvent, HttpInterceptor } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from 'src/environments/environment';

@Injectable()
export class JwtAuthInterceptor implements HttpInterceptor {
  constructor(private loginService: LoginService) { }

  intercept(request: HttpRequest<any>, next: HttpHandler): Observable<HttpEvent<any>> {
    // add authorization header with basic auth credentials if available
    const currentLoginInfo = this.loginService.userAccess.value;
    /*if(!environment.production){
        console.log(currentLoginInfo);
    }*/
    if (!request.headers.get("SkipContentType")) {
      request = request.clone({
        setHeaders: {
          'Content-Type': 'application/json; charset=utf-8;',
        }
      });
    }
    if (!environment.production) {
      request = request.clone({
        setHeaders: {
          'access-control-allow-origin': '*',
        }
      });
    }
    if (!request.headers.get("SkipAuth") && currentLoginInfo && currentLoginInfo.JwtToken) {
      request = request.clone({
        setHeaders: {
          Authorization: `Bearer ${currentLoginInfo.JwtToken}`,
        }
      });
    }
    return next.handle(request);
  }
}

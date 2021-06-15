import { environment } from './../../environments/environment';
import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { catchError, map } from 'rxjs/operators';
import { BehaviorSubject, Observable } from 'rxjs';
import { Utente } from './../model/utente.model'



export interface LoginCandidate {
  Username: string,
  Password: string
}

@Injectable({
  providedIn: 'root'
})
export class LoginService {
  userAccess: BehaviorSubject<Utente | null>
  get currentUser(): Utente | null {
    return this.userAccess.value;
  }
  constructor(private http: HttpClient) {
    this.userAccess = new BehaviorSubject<Utente | null>(null);
  }

  authenticate(candidate: LoginCandidate): void {
    this.http.post<Utente>(environment.apiurl + '/login',candidate).subscribe(utente => this.userAccess.next(utente));
  }

  updateUser(utente: Utente): void {
    this.http.put<Utente>(environment.apiurl + '/utenti/' + utente.ID,utente).subscribe(utente => this.userAccess.next(utente));
  }
}

import { environment } from './../../environments/environment';
import { HttpClient } from '@angular/common/http';
import { Component, OnInit } from '@angular/core';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { Utente } from '../model/utente.model';

@Component({
  selector: 'app-add-user',
  templateUrl: './add-user-compoent.component.html',
  styleUrls: ['./add-user-compoent.component.scss'],
})
export class AddUserCompoentComponent implements OnInit {
  userForm: FormGroup;

  constructor(private fb: FormBuilder, private http: HttpClient) {
    this.userForm = this.fb.group({
      Email: ['', Validators.required],
      Nome: ['', Validators.required],
    });
  }

  ngOnInit(): void {}

  onSubmit(): void {
    this.http.post<Utente>(environment.apiurl + '/utenti',this.userForm.value).subscribe(utente => console.log(utente));
  }
}

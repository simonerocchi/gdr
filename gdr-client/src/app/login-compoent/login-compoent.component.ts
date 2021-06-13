import { LoginService } from './../login/login.service';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { Component, OnInit } from '@angular/core';

@Component({
  selector: 'app-login',
  templateUrl: './login-compoent.component.html',
  styleUrls: ['./login-compoent.component.scss']
})
export class LoginCompoentComponent implements OnInit {
  loginForm: FormGroup
  constructor(private fb: FormBuilder, private loginService: LoginService) {
    this.loginForm = this.fb.group({
      Username: ['',Validators.required],
      Password: ['',Validators.required]
    })
  }

  ngOnInit(): void {
  }

  onSubmit(): void {
    this.loginService.authenticate(this.loginForm.value);
  }
}

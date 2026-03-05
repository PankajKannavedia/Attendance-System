import { Component } from '@angular/core';
import { ApiService } from '../../Services/api.service';
import { Router } from '@angular/router';

import { FormsModule } from '@angular/forms';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-login',
  imports: [FormsModule, CommonModule],
  templateUrl: './login.html',
  styleUrl: './login.scss'
})
export class LoginComponent {
  employeeId = '';
  password = '';
  errorMessage = '';

  constructor(
    private api: ApiService,
    private router: Router,
  ) {}

  handleLogin() {
    this.api.login({ employeeId: this.employeeId, password: this.password }).subscribe({
      next: (res) => {
        if (res.status === 'success') {
          localStorage.setItem('user', JSON.stringify(res.user));
          this.router.navigate(['/dashboard']);
        }
      },
      error: (err) => (this.errorMessage = err.error.message),
    });
  }
}

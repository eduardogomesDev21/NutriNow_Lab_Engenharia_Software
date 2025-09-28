import { Component, ViewEncapsulation } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { AuthService, LoginRequest } from '../services/auth.service';

@Component({
  selector: 'app-login',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './login.component.html',
  styleUrls: ['./login.component.css'],
  encapsulation: ViewEncapsulation.None
})
export class LoginComponent {
  showPassword = false;
  credenciais: LoginRequest = {
    email: '',
    password: ''
  };
  mensagem = '';
  erro = '';
  loading = false;

  constructor(
    private authService: AuthService,
    private router: Router
  ) {}

  togglePassword() {
    this.showPassword = !this.showPassword;
  }

  login(): void {
    this.mensagem = '';
    this.erro = '';
    this.loading = true;

    this.authService.login(this.credenciais).subscribe({
      next: (response) => {
        this.loading = false;
        if (response.success) {
          this.mensagem = response.message || 'Login realizado com sucesso!';
          setTimeout(() => {
            this.router.navigate(['/chatbot']);
          }, 1500);
        } else {
          this.erro = response.error || 'Erro ao realizar login';
        }
      },
      error: (err) => {
        this.loading = false;
        this.erro = err.error?.error || 'Erro ao realizar login';
      }
    });
  }
}
import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { AuthService, RegisterRequest } from '../services/auth.service';

@Component({
  selector: 'app-cadastro',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './cadastro.component.html',
  styleUrls: ['./cadastro.component.css']
})
export class CadastroComponent {
  showPassword = false;
  usuario: RegisterRequest = {
    first_name: '',
    last_name: '',
    birth_date: '',
    gender: '',
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
    console.log("Toggle clicado:", this.showPassword);
  }

  criarConta(): void {
    this.mensagem = '';
    this.erro = '';
    this.loading = true;

    this.authService.register(this.usuario).subscribe({
      next: (response) => {
        this.loading = false;
        if (response.success) {
          this.mensagem = response.message || 'Conta criada com sucesso!';
          this.usuario = {
            first_name: '',
            last_name: '',
            birth_date: '',
            gender: '',
            email: '',
            password: ''
          };
          setTimeout(() => {
            this.router.navigate(['/login']);
          }, 2000);
        } else {
          this.erro = response.error || 'Erro ao criar conta';
        }
      },
      error: (err) => {
        this.loading = false;
        this.erro = err.error?.error || 'Erro ao criar conta';
      }
    });
  }
}
import { Component, ViewEncapsulation } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { HttpClient, HttpClientModule } from '@angular/common/http';

@Component({
  selector: 'app-login',
  standalone: true,
  imports: [CommonModule, FormsModule, HttpClientModule],
  templateUrl: './login.component.html',
  styleUrls: ['./login.component.css'],
  encapsulation: ViewEncapsulation.None // 🔑 permite estilizar body e aplicar reset global só nesse componente
})
export class LoginComponent {
  credenciais = {
    email: '',
    senha: ''
  };

  mensagem = '';
  erro = '';

  constructor(private http: HttpClient) {}

  login(): void {
    this.mensagem = '';
    this.erro = '';

    this.http.post('http://localhost:5000/login', this.credenciais).subscribe({
      next: (res: any) => {
        this.mensagem = res.message || 'Login realizado com sucesso!';
        // Exemplo: salvar token no localStorage e redirecionar
        // localStorage.setItem('token', res.token);
      },
      error: (err) => {
        this.erro = err.error?.error || 'Erro ao realizar login';
      }
    });
  }
}

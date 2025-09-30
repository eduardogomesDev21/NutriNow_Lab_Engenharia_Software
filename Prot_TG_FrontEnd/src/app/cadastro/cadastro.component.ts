import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { HttpClient, HttpClientModule } from '@angular/common/http';

@Component({
  selector: 'app-cadastro',
  standalone: true,
  imports: [CommonModule, FormsModule, HttpClientModule],
  templateUrl: './cadastro.component.html',
  styleUrls: ['./cadastro.component.css']
})
export class CadastroComponent {
  showPassword = false;

  togglePassword() {
    this.showPassword = !this.showPassword;
    console.log("Toggle clicado:", this.showPassword);
  }

  usuario = {
    nome: '',
    sobrenome: '',
    data_nascimento: '',
    genero: '',
    email: '',
    senha: ''
  };

  mensagem = '';
  erro = '';

  constructor(private http: HttpClient) { }

  criarConta(): void {
    this.mensagem = '';
    this.erro = '';

    this.http.post('http://localhost:5000/cadastro', this.usuario).subscribe({
      next: (res: any) => {
        this.mensagem = res.message || 'Conta criada com sucesso!';
        this.usuario = { nome: '', sobrenome: '', data_nascimento: '', genero: '', email: '', senha: '' };
      },
      error: (err) => {
        this.erro = err.error?.error || 'Erro ao criar conta';
      }
    });
  }


}
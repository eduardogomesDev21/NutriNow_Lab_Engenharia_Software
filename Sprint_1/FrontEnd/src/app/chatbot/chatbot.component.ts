import { Component, OnInit, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { AuthService, User } from '../services/auth.service';
import { ChatService } from './../services/chat.service';
import { Subscription } from 'rxjs';

interface Message {
  text: string;
  isUser: boolean;
  timestamp: Date;
}

@Component({
  selector: 'app-chatbot',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './chatbot.component.html',
  styleUrls: ['./chatbot.component.css']
})
export class ChatbotComponent implements OnInit, OnDestroy {
  messages: Message[] = [];
  currentMessage = '';
  currentUser: User | null = null;
  loading = false;
  private subscription = new Subscription();

  constructor(
    private authService: AuthService,
    private chatService: ChatService,
    private router: Router
  ) {}

  ngOnInit() {
    this.subscription.add(
      this.authService.currentUser$.subscribe(user => {
        this.currentUser = user;
        if (!user) {
          this.router.navigate(['/login']);
        }
      })
    );
  }

  ngOnDestroy() {
    this.subscription.unsubscribe();
  }

  sendMessage() {
    if (!this.currentMessage.trim() || this.loading) return;

    const userMessage: Message = {
      text: this.currentMessage,
      isUser: true,
      timestamp: new Date()
    };

    this.messages.push(userMessage);
    const messageText = this.currentMessage;
    this.currentMessage = '';
    this.loading = true;

    this.chatService.sendMessage(messageText).subscribe({
      next: (response) => {
        this.loading = false;
        if (response.success) {
          this.chatService.setSessionId(response.session_id);

          const botMessage: Message = {
            text: response.response,
            isUser: false,
            timestamp: new Date()
          };
          this.messages.push(botMessage);
        } else {
          this.messages.push({
            text: response.error || 'Erro ao enviar mensagem',
            isUser: false,
            timestamp: new Date()
          });
        }
      },
      error: () => {
        this.loading = false;
        this.messages.push({
          text: 'Erro de conexão com o servidor',
          isUser: false,
          timestamp: new Date()
        });
      }
    });
  }

  logout() {
    this.authService.logout().subscribe({
      next: () => this.router.navigate(['/login']),
      error: (err) => {
        console.error('Erro ao fazer logout:', err);
        this.router.navigate(['/login']);
      }
    });
  }

  onFileSelected(event: any) {
    const file = event.target.files[0];
    if (file) {
      console.log('Arquivo selecionado:', file.name);
      // Aqui você pode enviar para o backend ou processar
    }
  }
}

import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ChatbotService, ChatResponse } from '../services/chatbot.service';

@Component({
  selector: 'app-chatbot',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './chatbot.component.html',
  styleUrls: ['./chatbot.component.css']
})
export class ChatbotComponent implements OnInit {
  message: string = '';
  messages: Array<{text: string, sender: 'user' | 'bot'}> = [];
  isLoading: boolean = false;

  constructor(private chatbotService: ChatbotService) { }

  ngOnInit(): void { }

  sendMessage(): void {
    if (!this.message.trim()) return;

    // Adiciona mensagem do usuário
    this.messages.push({
      text: this.message,
      sender: 'user'
    });

    const currentMessage = this.message;
    this.message = '';
    this.isLoading = true;

    // Envia para o backend
    this.chatbotService.sendMessage(currentMessage).subscribe({
      next: (response: ChatResponse) => {
        this.isLoading = false;
        this.messages.push({
          text: response.response,
          sender: 'bot'
        });
      },
      error: (error) => {
        this.isLoading = false;
        console.error('Erro na comunicação:', error);
        this.messages.push({
          text: 'Desculpe, ocorreu um erro. Tente novamente.',
          sender: 'bot'
        });
      }
    });
  }

  onFileSelected(event: any): void {
    const file = event.target.files[0];
    if (file) {
      this.isLoading = true;
      
      this.chatbotService.analyzeImage(file).subscribe({
        next: (response) => {
          this.isLoading = false;
          this.messages.push({
            text: `Análise da imagem: ${response.response}`,
            sender: 'bot'
          });
        },
        error: (error) => {
          this.isLoading = false;
          console.error('Erro na análise da imagem:', error);
          this.messages.push({
            text: 'Erro ao analisar a imagem. Tente novamente.',
            sender: 'bot'
          });
        }
      });
    }
  }
}
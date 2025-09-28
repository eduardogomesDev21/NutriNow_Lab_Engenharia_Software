import { Injectable } from '@angular/core';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Observable } from 'rxjs';

export interface ChatMessage {
  message: string;
  session_id?: string;
}

export interface ChatResponse {
  success: boolean;
  session_id: string;
  response: string;
  error?: string;
}

export interface ChatHistoryResponse {
  success: boolean;
  history: any[];
  error?: string;
}

@Injectable({
  providedIn: 'root'
})
export class ChatService {
  private apiUrl = 'http://127.0.0.1:8000/api';
  private sessionId: string | null = null;

  private httpOptions = {
    headers: new HttpHeaders({
      'Content-Type': 'application/json'
    }),
    withCredentials: true
  };

  constructor(private http: HttpClient) {}

  sendMessage(message: string): Observable<ChatResponse> {
    const payload: ChatMessage = {
      message: message,
      session_id: this.sessionId || undefined
    };

    return this.http.post<ChatResponse>(`${this.apiUrl}/chat`, payload, this.httpOptions);
  }

  getChatHistory(sessionId: string): Observable<ChatHistoryResponse> {
    return this.http.get<ChatHistoryResponse>(`${this.apiUrl}/chat_history?session_id=${sessionId}`, this.httpOptions);
  }

  analyzeImage(file: File, sessionId?: string): Observable<ChatResponse> {
    const formData = new FormData();
    formData.append('file', file);
    if (sessionId || this.sessionId) {
      formData.append('session_id', sessionId || this.sessionId!);
    }

    const options = {
      withCredentials: true
    };

    return this.http.post<ChatResponse>(`${this.apiUrl}/analyze_image`, formData, options);
  }

  setSessionId(sessionId: string): void {
    this.sessionId = sessionId;
  }

  getSessionId(): string | null {
    return this.sessionId;
  }
}
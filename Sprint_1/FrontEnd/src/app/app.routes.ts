import { Routes } from '@angular/router';
import { AuthGuard } from './services/auth.guard';
import { LoginComponent } from './login/login.component';
import { CadastroComponent } from './cadastro/cadastro.component';
import { HomeComponent } from './home/home.component';
import { ChatbotComponent } from './chatbot/chatbot.component';
import { EsqueciSenhaComponent } from './esqueci-senha/esqueci-senha.component';

export const routes: Routes = [
    {path: 'login', component: LoginComponent},
    {path: 'cadastro', component: CadastroComponent},
    {path: 'home', component: HomeComponent},
    {path: 'chatbot', component: ChatbotComponent, canActivate: [AuthGuard]},
    {path: 'esqueci-senha', component: EsqueciSenhaComponent},
    { path: '', redirectTo: 'home', pathMatch: 'full' }
];
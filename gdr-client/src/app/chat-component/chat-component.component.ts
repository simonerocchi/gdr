import { ChatContent, Messaggio, TipoMessaggio } from './../model/messaggio.model';
import { environment } from 'src/environments/environment';
import { SignalingService } from './../signaling/signaling.service';
import { Component, OnInit } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';

@Component({
  selector: 'app-chat',
  templateUrl: './chat-component.component.html',
  styleUrls: ['./chat-component.component.scss']
})
export class ChatComponentComponent implements OnInit {
  messages: Messaggio[] = [];
  chatForm: FormGroup;
  constructor(private signalingService: SignalingService, private http: HttpClient,private fb: FormBuilder) {
    this.chatForm = this.fb.group({
      text: ['', Validators.required],
    });
  }

  ngOnInit(): void {
    this.signalingService.chat.subscribe(m => {
      this.messages.push(m);
    });
    this.http.get<Messaggio[]>(environment.apiurl + '/messaggi',{params: new HttpParams().set('q','Tipo.equal=CHAT')}).subscribe(msgs => {
      this.messages = msgs;
    });
  }

  onSubmit(): void {
    let text = this.chatForm.value['text'];
    let content = <ChatContent>{
      Testo: text
    };
    let messaggio = <Messaggio>{
      Content: content,
      Tipo: TipoMessaggio.Chat
    };
    this.signalingService.send(messaggio);
    this.chatForm.setValue({'text':''});
  }

  scrollToBottom(): void {
    let el = document.getElementById('chatscrollarea');
    el?.scroll({
      top: el.scrollHeight,
      left: 0,
      behavior: 'auto'
    })
  }

  ngAfterViewChecked(): void {
    this.scrollToBottom();
  }

  roll(n: number): void {
    this.chatForm.setValue({'text': '/roll ' + n});
    this.onSubmit();
  }
}

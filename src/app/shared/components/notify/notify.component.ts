import { catchError, tap } from 'rxjs/operators';
import { Component, Input, OnInit } from '@angular/core';
import { AngularEditorConfig } from '@kolkov/angular-editor';
import { environment } from 'src/environments/environment';
import { throwError } from 'rxjs';
import { FileService } from '../../services/client/file.service';
import { Track } from 'ngx-audio-player';
import { ScriptsService } from '../../services/client/scripts.service';

@Component({
  selector: 'app-notify',
  templateUrl: './notify.component.html',
  styleUrls: ['./notify.component.css']
})
export class NotifyComponent implements OnInit {
  /* A class variable of name `title` and of type (:) `string` accessible to all methods using `this.title` in this file
   accessible using just `{{title}}` in the html file initialised with the value `Pop Up Notification` */
  @Input() title: string = 'Pop Up Notification';
  // title: string = 'Pop Up Notification';
  // title = 'Pop Up Notification';

  /* A class variable of name `message` and of type (:) `string` accessible to all methods using `this.message` in this file
 accessible using just`{{message}}` in the html file initialised with an empty value `` */
  @Input() message: string = '';

  /* A class *optional(!) variable of name `createdAt` and of type (!:) `Date` accessible to all methods using `this.createdAt` in this file
 accessible using just`{{createdAt}}` in the html file uninitialised */
  @Input() createdAt!: Date;

  /* A class variable of name `shouldShow` and of type (:) `boolean` accessible to all methods using `this.shouldShow` in this file
 accessible using just`${shouldShow}` in the html file initialised with the value true */
  @Input() shouldShow: boolean = false;

  /* A class variable of name `shouldShow` and of type (:) `boolean` accessible to all methods using `this.shouldShow` in this file
 accessible using just`${shouldShow}` in the html file initialised with the value true */
  @Input() messageHistory: Array<string> = [];

  /* A class variable of name `lists` and of type (:) `string` accessible to all methods using `this.lists` in this file
 accessible using just`${lists}` in the html file initialised with the value [] */
  lists: Array<any> = []
  editorConfig: AngularEditorConfig = {
    editable: true,
    spellcheck: true,
    height: '120px',
    minHeight: '100px',
    maxHeight: 'auto',
    width: 'auto',
    minWidth: '0',
    translate: 'yes',
    enableToolbar: true,
    showToolbar: false,
    placeholder: 'Enter text here...',
    defaultParagraphSeparator: '',
    defaultFontName: '',
    defaultFontSize: '',
    fonts: [
      { class: 'arial', name: 'Arial' },
      { class: 'times-new-roman', name: 'Times New Roman' },
      { class: 'calibri', name: 'Calibri' },
      { class: 'comic-sans-ms', name: 'Comic Sans MS' }
    ],
    customClasses: [
      {
        name: 'quote',
        class: 'quote',
      },
      {
        name: 'redText',
        class: 'redText'
      },
      {
        name: 'titleText',
        class: 'titleText',
        tag: 'h1',
      },
    ],
    uploadUrl: `${environment.uploadApi}/upload`,
    upload: (file: File) => {

      let formData = new FormData();
      formData.append('file', file, file.name)
      return this._fs.upload(formData)
        .pipe(
          catchError((err: any) => {

            return throwError(err);
          }),
          tap((res: any) => {



          })
        );
    },
    uploadWithCredentials: false,
    sanitize: true,
    toolbarPosition: 'top',
    toolbarHiddenButtons: [
      ['bold', 'italic'],
      ['fontSize']
    ]
  };
  mssapDisplayTitle = true;
  mssapDisablePositionSlider = true;
  mssapDisplayRepeatControls = true;
  mssapDisplayVolumeControls = true;
  mssapDisplayVolumeSlider = false;
  autoPlay:boolean =true;
  // Material Style Simple Audio Player
  mssapPlaylist: Track[] = [
    {
      title: 'Beep',
      link: environment.appDomain + '/assets/audio/beep-10.wav',
      artist: 'Beep 10',
      duration: 4
    }
  ];
  startedConversation: boolean = false;
  /* A class method of name `constructor` doing nothing. A special method the program class[NotifyComponent] helps you run once class is created */
  constructor(private _fs: FileService, private scriptService:ScriptsService) {
    console.log(this.createdAt)
  }
  /* A class method of name `ngOnInit` doing something. A special method the program class[NotifyComponent] helps you run once component
    and is initiated and all its variables are initiated */
  ngOnInit(): void {
    console.log("NGONINIT called")
    if (!this.createdAt) {
      this.createdAt = new Date(Date.now())
    }
    console.log(this.createdAt)
    // Call of method
    this.loadTempoaryNotification();
  }

  /* A class method of name `loadTempoaryNotification` of shorthanded for-loop to push 5 items to the this.list variable.
  A custom method the program class[NotifyComponent]  does not run until called*/
  loadTempoaryNotification() {
    [1, 2, 3, 4, 5].forEach((value: any) => {
      this.lists.push(
        {
          id: value,
          createdAt: new Date(Date.now()),
          title: `Notification ${value}`,
          status: false,
          message: `Message of notification ${value}, You have to understand for each notification, this is auto mapped and stored for tempoarydisplay. Message of notification ${value}, You have to understand for each notification, this is auto mapped and stored for tempoarydisplay.`
        }
      )
    })
  }
  // A method to close the notification Component
  close() {
    this.shouldShow = false
  }

  // A method to send the message to the server
  send() {
    this.messageHistory.push(this.message);
    this.message = '';
  }

  toggleSound(){
    this.autoPlay = !this.autoPlay
  }
  // Callback Events

  onTrackPlaying(event) {
    console.log(event);
    // your logic which needs to
    // be triggered once the
    // track ends goes here.
  }


  onTrackPaused(event) {
    console.log(event);
    // your logic which needs to
    // be triggered once the
    // track ends goes here.
  }

  onEnded(event) {
    console.log(event);
    // your logic which needs to
    // be triggered once the
    // track ends goes here.
  }

  onNextTrackRequested(event) {
    console.log(event);
    // your logic which needs to
    // be triggered once the
    // track ends goes here.
  }


  onPreviousTrackRequested(event) {
    console.log(event);
    // your logic which needs to
    // be triggered once the
    // track ends goes here.
  }

  onTrackSelected(event) {
    console.log(event);
    // your logic which needs to
    // be triggered once the
    // track ends goes here.
  }

  startChat(state:boolean){
    this.startedConversation =state;
  }
  navigateTo(state:boolean){
    this.shouldShow = state;
    // this.scriptService.changePage('support');
  }


}

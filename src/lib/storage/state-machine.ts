export type FileState =
  | { readonly _tag: 'Idle' }
  | { readonly _tag: 'Uploading'; readonly progress?: number }
  | { readonly _tag: 'Uploaded'; readonly url: string; readonly key: string }
  | { readonly _tag: 'Deleting'; readonly key: string }
  | { readonly _tag: 'Failure'; readonly error: string; readonly phase: 'upload' | 'delete' };

export type FileEvent =
  | { readonly _tag: 'StartUpload' }
  | { readonly _tag: 'UploadSuccess'; readonly url: string; readonly key: string }
  | { readonly _tag: 'UploadFailure'; readonly error: string }
  | { readonly _tag: 'StartDelete'; readonly key: string }
  | { readonly _tag: 'DeleteSuccess' }
  | { readonly _tag: 'DeleteFailure'; readonly error: string }
  | { readonly _tag: 'Reset' };

export class FileLifecycleStateMachine {
  private currentState: FileState;
  private listeners: Set<(state: FileState) => void>;

  constructor(initialState: FileState = { _tag: 'Idle' }) {
    this.currentState = initialState;
    this.listeners = new Set();
  }

  getState(): FileState {
    return this.currentState;
  }

  subscribe(listener: (state: FileState) => void): () => void {
    this.listeners.add(listener);
    // Call listener immediately on subscription
    listener(this.currentState);
    return () => {
      this.listeners.delete(listener);
    };
  }

  private notify() {
    for (const listener of this.listeners) {
      listener(this.currentState);
    }
  }

  transition(event: FileEvent): FileState {
    const nextState = this.getNextState(this.currentState, event);
    if (nextState !== this.currentState) {
      this.currentState = nextState;
      this.notify();
    }
    return this.currentState;
  }

  private getNextState(state: FileState, event: FileEvent): FileState {
    switch (state._tag) {
      case 'Idle':
        if (event._tag === 'StartUpload') {
          return { _tag: 'Uploading' };
        }
        break;

      case 'Uploading':
        if (event._tag === 'UploadSuccess') {
          return { _tag: 'Uploaded', url: event.url, key: event.key };
        }
        if (event._tag === 'UploadFailure') {
          return { _tag: 'Failure', error: event.error, phase: 'upload' };
        }
        break;

      case 'Uploaded':
        if (event._tag === 'StartDelete') {
          return { _tag: 'Deleting', key: event.key };
        }
        if (event._tag === 'Reset') {
          return { _tag: 'Idle' };
        }
        break;

      case 'Deleting':
        if (event._tag === 'DeleteSuccess') {
          return { _tag: 'Idle' };
        }
        if (event._tag === 'DeleteFailure') {
          return { _tag: 'Failure', error: event.error, phase: 'delete' };
        }
        break;

      case 'Failure':
        if (event._tag === 'Reset') {
          return { _tag: 'Idle' };
        }
        if (event._tag === 'StartUpload') {
          return { _tag: 'Uploading' };
        }
        break;
    }

    return state;
  }
}

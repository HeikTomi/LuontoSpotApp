import 'i18next';

declare module 'i18next' {
  interface CustomTypeOptions {
    defaultNS: 'translation';
    resources: {
      translation: {
        welcome: string;
        goodbye: string;
        placeholderTitle: string;
        placeholderNote: string;
        buttonAddNote: string;
        noImageText: string;
        deleteTitle: string;
        deleteText: string;
        camera: string;
        alertEmptyTitle: string;
        noPhotoNotes: string;
        register: string;
        registerText: string;
        login: string;
        logout: string;
        skipLogin: string;
        loginWithGoogle: string;
        loginWithFacebook: string;
        loginWithApple: string;
        loginWithEmail: string;
        email: string;
        password: string;
        confirmPassword: string;
        forgotPassword: string;
        resetPassword: string;
        resetPasswordText: string;
        slogan: string;
        notes: string;
        addNote: string;
        editNote: string;
        deleteNote: string;
        save: string;
        cancel: string;
        settings: string;
        map: string;
      };
    };
  }
}

import 'i18next';

declare module 'i18next' {
  interface CustomTypeOptions {
    defaultNS: 'translation';
    resources: {
      translation: {
        welcome: string;
        goodbye: string;
        appName: string;
        placeholderTitle: string;
        placeholderNote: string;
        buttonAddNote: string;
        noImageText: string;
        deleteTitle: string;
        deleteText: string;
        camera: string;
        alertEmptyTitle: string;
        noPhotoNotes: string;
      };
    };
  }
}

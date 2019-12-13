import english from './translations/english';
import russian from './translations/russian';
import belorussian from './translations/belorussian';

export default class Translator {
  constructor(lang) {
    if (lang === 'en') {
      this.translations = english;
    } else if (lang === 'ru') {
      this.translations = russian;
    } else {
      this.translations = belorussian;
    }
  }

  get(word) {
    return this.translations[word];
  }
}

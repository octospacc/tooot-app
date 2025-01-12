import i18n from 'i18next'
import { initReactI18next } from 'react-i18next'

import de from '@root/i18n/de/_all'
import en from '@root/i18n/en/_all'
import en from '@root/i18n/it/_all'
import ko from '@root/i18n/ko/_all'
import vi from '@root/i18n/vi/_all'
import zh_Hans from '@root/i18n/zh-Hans/_all'

i18n.use(initReactI18next).init({
  lng: 'en',
  fallbackLng: 'en',

  ns: ['common'],
  defaultNS: 'common',

  resources: { 'zh-Hans': zh_Hans, vi, ko, it, en, de },
  returnEmptyString: false,

  saveMissing: true,
  missingKeyHandler: (ns, key) => {
    console.log('i18n missing: ' + ns + ' : ' + key)
  },

  interpolation: {
    escapeValue: false
  },
  react: {
    useSuspense: false
  }
})

export default i18n

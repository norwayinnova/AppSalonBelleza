export interface AppTheme {
  appName: string;
  primaryColor: string;
  secondaryColor: string;
  darkTextColor: string;
  lightTextColor: string;
  backgroundColor: string;
  logoPath: any;
}

export const themes: Record<string, AppTheme> = {
  avalon_mystic: {
    appName: 'Avalon Mystic',
    primaryColor: '#D48A9A',
    secondaryColor: '#f0f0f0',
    darkTextColor: '#7A4B56',
    lightTextColor: '#FFFFFF',
    backgroundColor: '#FFFFFF',
    logoPath: require('../../assets/logo.jpg')
  },
  appbeauty: {
    appName: 'AppBeauty',
    primaryColor: '#3498db',
    secondaryColor: '#ecf0f1',
    darkTextColor: '#2c3e50',
    lightTextColor: '#FFFFFF',
    backgroundColor: '#FFFFFF',
    logoPath: require('../../assets/logo.jpg') // Ideally they would provide a different logo later
  }
};

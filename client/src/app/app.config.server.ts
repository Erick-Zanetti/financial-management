import { provideHttpClient } from '@angular/common/http';
import { ApplicationConfig, mergeApplicationConfig } from '@angular/core';
import { provideServerRendering } from '@angular/platform-server';
import { provideCharts, withDefaultRegisterables } from 'ng2-charts';
import { appConfig } from './app.config';

const serverConfig: ApplicationConfig = {
  providers: [
    provideServerRendering(),
    provideHttpClient(),
    provideCharts(withDefaultRegisterables())
  ]
};

export const config = mergeApplicationConfig(appConfig, serverConfig);

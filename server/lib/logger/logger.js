// @ts-check

// include and initialize the rollbar library with your access token
import Rollbar from 'rollbar';

const mode = process.env.NODE_ENV || 'development';

const rollbar = new Rollbar({
  accessToken: process.env.ROLLBAR_ACCESS_TOKEN || '',
  captureUncaught: true,
  captureUnhandledRejections: true,
  environment: mode,
  enabled: !!process.env.ROLLBAR_ACCESS_TOKEN,
});

export default rollbar;

// import { TracingEaCRuntime } from '../src/runtime/TracingEaCRuntime.ts';
import { TracingEaCRuntime } from '../src/runtime/TracingEaCRuntime.ts';
import { defineEaCConfig } from '../src/runtime/config/defineEaCConfig.ts';

export default defineEaCConfig({
  EaC: {
    Projects: {
      marketing: {
        Details: {
          Name: 'Main marketing website',
          Description: 'The main marketing website to use.',
          Priority: 100,
        },
        LookupConfigs: {
          dev: {
            Hostname: 'localhost',
            Port: 6120,
          },
        },
        ApplicationLookups: {
          home: {
            PathPattern: '/*',
            Priority: 100,
          },
          docs: {
            PathPattern: '/docs/*',
            Priority: 200,
          },
          signin: {
            PathPattern: '/signin',
            Priority: 300,
          },
        },
      },
      dashboard: {
        Details: {
          Name: 'Dashboard website',
          Description: 'The dashboard website to use.',
          Priority: 200,
        },
        LookupConfigs: {
          dev: {
            Hostname: 'localhost',
            Port: 6121,
          },
        },
        ApplicationLookups: {
          dashboard: {
            PathPattern: '/*',
            Priority: 300,
          },
          profile: {
            PathPattern: '/profile/*',
            Priority: 400,
          },
          signout: {
            PathPattern: '/signout',
            Priority: 500,
          },
        },
      },
    },
    Applications: {
      home: {
        Details: {
          Name: 'Home Site',
          Description:
            'The home site to be used for the marketing of the project',
        },
      },
      docs: {
        Details: {
          Name: 'Documentation Site',
          Description: 'The documentation site for the project',
        },
      },
      signin: {
        Details: {
          Name: 'Sign In Site',
          Description: 'The site for use in authenticating a user',
        },
      },
      signout: {
        Details: {
          Name: 'Sign Out Site',
          Description: 'The site for use in signing out a user',
        },
      },
      dashboard: {
        Details: {
          Name: 'Dashboard Site',
          Description: 'The site used to display the main dashboard',
        },
      },
      profile: {
        Details: {
          Name: 'Profile Site',
          Description:
            'The site used to for user profile display and management',
        },
      },
    },
  },
  //   Runtime: (cfg) => new TracingEaCRuntime(cfg),
  Server: {
    port: 6120,
  },
});

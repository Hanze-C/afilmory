export type OnboardingSettingKey =
  | 'ai.openai.apiKey'
  | 'ai.openai.baseUrl'
  | 'ai.embedding.model'
  | 'auth.google.clientId'
  | 'auth.google.clientSecret'
  | 'auth.github.clientId'
  | 'auth.github.clientSecret'
  | 'http.cors.allowedOrigins'
  | 'services.amap.apiKey'

export type SettingFieldDefinition = {
  key: OnboardingSettingKey
  label: string
  description: string
  placeholder?: string
  helper?: string
  sensitive?: boolean
  multiline?: boolean
}

export type SettingSectionDefinition = {
  id: string
  title: string
  description: string
  fields: SettingFieldDefinition[]
}

export const ONBOARDING_SETTING_SECTIONS: SettingSectionDefinition[] = [
  {
    id: 'auth',
    title: 'Authentication Providers',
    description:
      'Configure OAuth providers that will be available to your team. You can add them later from the settings panel as well.',
    fields: [
      {
        key: 'auth.google.clientId',
        label: 'Google Client ID',
        description: 'Public identifier issued by Google OAuth.',
        placeholder: '1234567890-abc.apps.googleusercontent.com',
      },
      {
        key: 'auth.google.clientSecret',
        label: 'Google Client Secret',
        description:
          'Keep this secret safe. Required together with the client ID to enable Google sign-in.',
        placeholder: 'GOCSPX-xxxxxxxxxxxxxxxxxx',
        sensitive: true,
      },
      {
        key: 'auth.github.clientId',
        label: 'GitHub Client ID',
        description: 'Public identifier for your GitHub OAuth App.',
        placeholder: 'Iv1.0123456789abcdef',
      },
      {
        key: 'auth.github.clientSecret',
        label: 'GitHub Client Secret',
        description: 'Used to authorize GitHub OAuth callbacks.',
        placeholder: 'e3a2f9c0f2bdc...',
        sensitive: true,
      },
    ],
  },
  {
    id: 'ai',
    title: 'AI & Embeddings',
    description:
      'Optional integrations for AI powered features. Provide your OpenAI credentials and preferred embedding model.',
    fields: [
      {
        key: 'ai.openai.apiKey',
        label: 'OpenAI API Key',
        description:
          'Used for generating captions, titles, and AI assistance across the platform.',
        placeholder: 'sk-proj-xxxxxxxxxxxxxxxx',
        sensitive: true,
      },
      {
        key: 'ai.openai.baseUrl',
        label: 'OpenAI Base URL',
        description:
          'Override the default api.openai.com endpoint if you proxy requests.',
        placeholder: 'https://api.openai.com/v1',
      },
      {
        key: 'ai.embedding.model',
        label: 'Embedding Model',
        description:
          'Model identifier to compute embeddings for search and semantic features.',
        placeholder: 'text-embedding-3-large',
      },
    ],
  },
  {
    id: 'map',
    title: 'Map Services',
    description:
      'Connect Gaode (Amap) maps to unlock geolocation previews for your photos.',
    fields: [
      {
        key: 'services.amap.apiKey',
        label: 'Gaode (Amap) API Key',
        description: 'Required to render photo locations on the dashboard.',
        placeholder: 'your-amap-api-key',
        sensitive: true,
      },
    ],
  },
  {
    id: 'network',
    title: 'Network & CORS',
    description: 'Restrict which origins can access the backend APIs.',
    fields: [
      {
        key: 'http.cors.allowedOrigins',
        label: 'Allowed Origins',
        description:
          'Comma separated list of origins. Example: https://dashboard.afilmory.com, https://afilmory.app',
        placeholder: 'https://dashboard.afilmory.com, https://afilmory.app',
        helper: 'Leave empty to keep the default wildcard policy during setup.',
        multiline: true,
      },
    ],
  },
]

export const ONBOARDING_TOTAL_STEPS = 5 as const
export const ONBOARDING_STEP_ORDER = [
  'welcome',
  'tenant',
  'admin',
  'settings',
  'review',
] as const

export type OnboardingStepId = (typeof ONBOARDING_STEP_ORDER)[number]

export type OnboardingStep = {
  id: OnboardingStepId
  title: string
  description: string
}

export const ONBOARDING_STEPS: OnboardingStep[] = [
  {
    id: 'welcome',
    title: 'Welcome',
    description: 'Verify environment and prepare initialization.',
  },
  {
    id: 'tenant',
    title: 'Tenant Profile',
    description: 'Name your workspace and optional domain.',
  },
  {
    id: 'admin',
    title: 'Administrator',
    description: 'Create the first tenant admin account.',
  },
  {
    id: 'settings',
    title: 'Platform Settings',
    description: 'Set optional integration keys before launch.',
  },
  {
    id: 'review',
    title: 'Review & Launch',
    description: 'Confirm details and finalize initialization.',
  },
]

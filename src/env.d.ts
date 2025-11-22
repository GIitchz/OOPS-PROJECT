/// <reference types="vite/client" />

interface ImportMetaEnv {
  readonly VITE_GMAP_KEY: string;
  // Add more environment variables here as needed
}

interface ImportMeta {
  readonly env: ImportMetaEnv;
}

/// <reference types="googlemaps" />

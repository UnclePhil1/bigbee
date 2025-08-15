// Environment configuration for different deployment environments
export const config = {
  // Backend URL - will be different for development vs production
  backendUrl: import.meta.env.VITE_BACKEND_URL || 'http://localhost:3001',
  
  // Supabase configuration
  supabaseUrl: import.meta.env.VITE_PUBLIC_SUPABASE_URL || '',
  supabaseAnonKey: import.meta.env.VITE_PUBLIC_SUPABASE_ANON_KEY || '',
  
  // Environment detection
  isDevelopment: import.meta.env.DEV,
  isProduction: import.meta.env.PROD,
  
  // Frontend URL for CORS
  frontendUrl: import.meta.env.VITE_FRONTEND_URL || 'http://localhost:5173',
};

// Log configuration in development
if (config.isDevelopment) {
  console.log('🔧 Environment Configuration:', {
    backendUrl: config.backendUrl,
    isDevelopment: config.isDevelopment,
    isProduction: config.isProduction,
  });
}

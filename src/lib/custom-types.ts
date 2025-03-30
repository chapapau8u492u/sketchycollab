
import type { Database } from '@/integrations/supabase/types';

// Extend database types without modifying the original file
export type ProfileWithOnlineStatus = Database['public']['Tables']['profiles']['Row'] & {
  is_online?: boolean;
  last_active?: string;
};

// Create a type for board objects data
export type BoardObjectData = {
  id: string;
  [key: string]: any;
};

// Helper type for spreading objects safely
export type SpreadableObject = Record<string, any>;

// Export original types to maintain compatibility
export * from '../integrations/supabase/types';

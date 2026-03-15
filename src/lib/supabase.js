import { createClient } from '@supabase/supabase-js';

const supabaseUrl = 'https://dxdjanizeyrrerlgmjve.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImR4ZGphbml6ZXlycmVybGdtanZlIiwicm9sZSI6ImFub24iLCJpYXQiOjE3Mzg4NzYzMzQsImV4cCI6MjA1NDQ1MjMzNH0.6osg_mff7nvxJuPldtyVLJY15XVFXcOQ_p7CxZ7O9WI';

export const supabase = createClient(supabaseUrl, supabaseKey);

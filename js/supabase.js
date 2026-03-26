import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const supabaseUrl = 'https://dugwjmafpffeykpkkpna.supabase.co'
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImR1Z3dqbWFmcGZmZXlrcGtrcG5hIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzMyMDE0NDIsImV4cCI6MjA4ODc3NzQ0Mn0.WS-DSZPMxnlV1HKTCTjwYMODVXGyjf7wB5MVJ5NklCs'

// Esto crea el cliente y lo hace accesible para todos tus archivos
export const supabase = createClient(supabaseUrl, supabaseKey)
window.supabaseClient = supabase;

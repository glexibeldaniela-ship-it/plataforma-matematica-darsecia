// js/supabase.js
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

// Tus llaves (ya las tenemos)
const supabaseUrl = 'https://dugwjmafpffeykpkkpna.supabase.co'
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImR1Z3dqbWFmcGZmZXlrcGtrcG5hIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzMyMDE0NDIsImV4cCI6MjA4ODc3NzQ0Mn0.WS-DSZPMxnlV1HKTCTjwYMODVXGyjf7wB5MVJ5NklCs'

// Crear el cliente
export const supabase = createClient(supabaseUrl, supabaseKey)
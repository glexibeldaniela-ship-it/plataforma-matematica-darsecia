// js/supabase.js
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

// 1. Usamos la URL y Key del proyecto NUEVO (abejdltqyeuslgmmfucx)
const supabaseUrl = 'https://abejdltqyeuslgmmfucx.supabase.co'
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImFiZWpkbHRxeWV1c2xnbW1mdWN4Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjkwMTIxNzIsImV4cCI6MjA4NDU4ODE3Mn0.7lT2M4ebC2r9oXIOhA3CfR5YKqg92q48n9UkkH93UuI'

// 2. Creamos la conexión oficial
export const supabase = createClient(supabaseUrl, supabaseKey)

// 3. LA CLAVE DEL ÉXITO: 
// Asignamos la conexión a 'window.n' porque tus archivos .js 
// (como registro.js) usan 'n' para trabajar.
window.n = supabase;

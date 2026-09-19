import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { RouterProvider } from 'react-router-dom'
import { QueryProvider } from './app/providers/QueryProvider'
import { router } from './app/router'
import './index.css'

// Global listener to ensure clicking anywhere inside any date input (including modal popups) triggers the datepicker popup
document.addEventListener('click', (e) => {
  const target = e.target as HTMLElement | null;
  if (target && target.tagName === 'INPUT' && (target as HTMLInputElement).type === 'date') {
    const input = target as HTMLInputElement;
    if (!input.disabled && !input.readOnly) {
      try {
        input.showPicker?.();
      } catch {
        // Safe ignore if unsupported or already showing
      }
    }
  }
});

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <QueryProvider>
      <RouterProvider router={router} />
    </QueryProvider>
  </StrictMode>,
)


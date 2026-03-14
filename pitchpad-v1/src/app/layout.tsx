import type { Metadata } from 'next'
import './globals.css'
import { Toaster } from 'sonner'

export const metadata: Metadata = {
  title: { default: 'PitchPad — Lenovo Innovation', template: '%s | PitchPad' },
  description: 'Submit ideas, receive expert feedback, generate pitch decks with AI.',
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body>
        {children}
        <Toaster position="top-right" toastOptions={{ style: { background:'#fff', border:'1px solid #E6E6E6', color:'#333', fontFamily:'IBM Plex Sans, sans-serif', fontSize:'13px', borderRadius:'4px' } }} />
      </body>
    </html>
  )
}

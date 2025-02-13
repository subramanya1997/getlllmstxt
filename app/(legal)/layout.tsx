interface LegalLayoutProps {
  children: React.ReactNode
}

export default function LegalLayout({ children }: LegalLayoutProps) {
  return (
    <div className="min-h-screen pt-20">
      {children}
    </div>
  )
} 
interface AuthLayoutProps {
  children: React.ReactNode
}

export default function AuthLayout({ children }: AuthLayoutProps) {
  return (
    <div className="h-full">
      <main className="flex-grow">
        {children}
      </main>
    </div>
  )
}
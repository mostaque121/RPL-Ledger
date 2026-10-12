import { zodResolver } from '@hookform/resolvers/zod'
import { Loader2Icon, LockKeyholeIcon } from 'lucide-react'
import { useForm } from 'react-hook-form'
import { Navigate, useLocation, useNavigate } from 'react-router'
import { Logo } from '@/components/brand/Logo'
import { useDocumentTitle } from '@/hooks/use-document-title'
import { PasswordInput } from '@/components/forms/PasswordInput'
import { ThemeToggle } from '@/components/layout/ThemeToggle'
import { Button } from '@/components/ui/button'
import { Field, FieldError, FieldGroup, FieldLabel } from '@/components/ui/field'
import { Input } from '@/components/ui/input'
import { useAuth } from '../auth-context'
import { loginSchema, type LoginValues } from '../schema'

const HIGHLIGHTS = [
  { label: 'Sales & instalments', tone: 'bg-success' },
  { label: 'RTO payments & hold', tone: 'bg-warning' },
  { label: 'Expenses in AUD & BDT', tone: 'bg-danger' },
  { label: 'Partner take-home', tone: 'bg-sidebar-primary' },
]

export function LoginPage() {
  const { session, signIn } = useAuth()
  const navigate = useNavigate()
  const location = useLocation()
  useDocumentTitle('Sign in')
  const from = (location.state as { from?: string } | null)?.from ?? '/'

  const form = useForm<LoginValues>({
    resolver: zodResolver(loginSchema),
    defaultValues: { email: '', password: '' },
  })
  const { errors, isSubmitting } = form.formState

  if (session) return <Navigate to={from} replace />

  async function onSubmit(values: LoginValues) {
    try {
      await signIn(values.email, values.password)
      navigate(from, { replace: true })
    } catch {
      form.setError('root', { message: 'Wrong email or password.' })
    }
  }

  return (
    <div className="grid min-h-svh lg:grid-cols-[1.1fr_1fr]">
      {/* Brand panel */}
      <aside className="relative hidden overflow-hidden bg-sidebar p-12 text-sidebar-foreground lg:flex lg:flex-col">
        <div
          aria-hidden
          className="pointer-events-none absolute -top-40 -right-40 size-130 rounded-full bg-sidebar-primary/25 blur-3xl"
        />
        <Logo className="relative text-sidebar-accent-foreground" />
        <div className="relative mt-auto max-w-md">
          <h1 className="text-4xl leading-tight font-extrabold tracking-tight text-sidebar-accent-foreground">
            Every dollar, accounted for.
          </h1>
          <p className="mt-4 text-base opacity-80">
            Sales, instalments, RTO costs, expenses, and each partner's take-home in one place.
          </p>
          <ul className="mt-8 grid grid-cols-2 gap-3 text-sm font-medium">
            {HIGHLIGHTS.map((h) => (
              <li key={h.label} className="flex items-center gap-2.5 rounded-lg bg-sidebar-accent px-3 py-2.5">
                <span className={`size-2.5 rounded-full ${h.tone}`} />
                {h.label}
              </li>
            ))}
          </ul>
        </div>
      </aside>

      {/* Form */}
      <main className="relative flex items-center justify-center p-6 sm:p-12">
        <div className="absolute top-4 right-4">
          <ThemeToggle />
        </div>
        <div className="w-full max-w-sm">
          <Logo className="mb-10 lg:hidden" />
          <div className="mb-8 space-y-2">
            <span className="grid size-11 place-items-center rounded-xl bg-accent text-accent-foreground">
              <LockKeyholeIcon className="size-5" />
            </span>
            <h2 className="pt-2 text-2xl font-extrabold tracking-tight">Sign in</h2>
            <p className="text-sm text-muted-foreground">Private ledger. Authorised access only.</p>
          </div>

          <form onSubmit={form.handleSubmit(onSubmit)} noValidate>
            <FieldGroup>
              <Field data-invalid={!!errors.email}>
                <FieldLabel htmlFor="email">Email</FieldLabel>
                <Input
                  id="email"
                  type="email"
                  autoComplete="email"
                  autoFocus
                  className="h-11"
                  aria-invalid={!!errors.email}
                  {...form.register('email')}
                />
                <FieldError errors={[errors.email]} />
              </Field>
              <Field data-invalid={!!errors.password}>
                <FieldLabel htmlFor="password">Password</FieldLabel>
                <PasswordInput
                  id="password"
                  autoComplete="current-password"
                  className="h-11"
                  aria-invalid={!!errors.password}
                  {...form.register('password')}
                />
                <FieldError errors={[errors.password]} />
              </Field>

              {errors.root && (
                <p role="alert" className="rounded-lg border border-danger/40 bg-danger/10 px-3 py-2 text-sm font-medium text-danger">
                  {errors.root.message}
                </p>
              )}

              <Button type="submit" className="h-11 text-sm font-bold" disabled={isSubmitting}>
                {isSubmitting && <Loader2Icon className="animate-spin" />}
                Sign in
              </Button>
            </FieldGroup>
          </form>
        </div>
      </main>
    </div>
  )
}

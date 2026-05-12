import { LoginForm } from '@/components/shared/login-form';

export default function LoginPage() {
  return (
    <div className="flex min-h-screen items-center justify-center bg-background px-4">
      <div className="w-full max-w-md space-y-4">
        <div className="text-center">
          <p className="text-xs uppercase tracking-widest text-muted-foreground">Fee Tracker</p>
          <h1 className="text-2xl font-semibold">Computer Coaching Class</h1>
        </div>
        <LoginForm />
      </div>
    </div>
  );
}

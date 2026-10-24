import { Metadata } from 'next';
import AuthView from '@/components/auth/AuthView';

export const metadata: Metadata = {
  title: 'Sign In - Vaatify GEO',
  description: 'Sign in to your Vaatify Generative Engine Optimization workspace.',
};

export default function LoginPage() {
  return <AuthView initialMode="login" />;
}

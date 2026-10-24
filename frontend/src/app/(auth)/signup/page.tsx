import { Metadata } from 'next';
import AuthView from '@/components/auth/AuthView';

export const metadata: Metadata = {
  title: 'Create Account - Vaatify GEO',
  description: 'Create your account to start tracking and dominating AI search presence across ChatGPT, Perplexity, and Google AI Overviews.',
};

export default function SignupPage() {
  return <AuthView initialMode="signup" />;
}

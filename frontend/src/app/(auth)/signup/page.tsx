import { Metadata } from 'next';
import AuthView from '@/components/auth/AuthView';

export const metadata: Metadata = {
  title: 'Register Your Brand - Vaatify GEO',
  description: 'Register your brand to start tracking and dominating AI search presence across ChatGPT, Perplexity, and Google AI Overviews.',
};

export default function SignupPage() {
  return <AuthView key="signup" initialMode="signup" />;
}

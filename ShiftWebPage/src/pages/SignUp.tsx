import React from 'react';
import { SignUpForm } from '../components/auth/SignUpForm';

export function SignUp() {
  return (
    <div className="pt-32">
      <section className="container mx-auto px-6">
        <div className="max-w-md mx-auto">
          <h1 className="text-4xl font-bold mb-6 text-center">Create Account</h1>
          <SignUpForm />
        </div>
      </section>
    </div>
  );
}
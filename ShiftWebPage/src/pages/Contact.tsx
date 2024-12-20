import React from 'react';
import { ContactForm } from '../components/contact/ContactForm';

export function Contact() {
  return (
    <div className="pt-32">
      <section className="container mx-auto px-6">
        <div className="max-w-3xl mx-auto text-center mb-16">
          <h1 className="text-4xl font-bold mb-6">Get in Touch</h1>
          <p className="text-xl text-gray-600">
            Have questions? We're here to help
          </p>
        </div>

        <div className="max-w-xl mx-auto">
          <ContactForm />
        </div>
      </section>
    </div>
  );
}
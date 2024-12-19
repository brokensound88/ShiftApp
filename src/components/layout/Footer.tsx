import React from 'react';
import { Link } from 'react-router-dom';

export function Footer() {
  return (
    <footer className="bg-gray-50 border-t border-gray-100">
      <div className="container mx-auto px-6 py-12">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-8">
          <div>
            <h3 className="font-semibold mb-4">Product</h3>
            <FooterLinks
              links={[
                { label: 'Features', to: '/features' },
                { label: 'Pricing', to: '/pricing' },
                { label: 'Security', to: '/security' },
              ]}
            />
          </div>
          <div>
            <h3 className="font-semibold mb-4">Company</h3>
            <FooterLinks
              links={[
                { label: 'About', to: '/about' },
                { label: 'Contact', to: '/contact' },
                { label: 'Careers', to: '/careers' },
              ]}
            />
          </div>
          <div>
            <h3 className="font-semibold mb-4">Resources</h3>
            <FooterLinks
              links={[
                { label: 'Documentation', to: '/docs' },
                { label: 'Blog', to: '/blog' },
                { label: 'Support', to: '/support' },
              ]}
            />
          </div>
          <div>
            <h3 className="font-semibold mb-4">Legal</h3>
            <FooterLinks
              links={[
                { label: 'Privacy', to: '/privacy' },
                { label: 'Terms', to: '/terms' },
                { label: 'Compliance', to: '/compliance' },
              ]}
            />
          </div>
        </div>
        <div className="mt-12 pt-8 border-t border-gray-200">
          <p className="text-gray-500 text-sm text-center">
            © {new Date().getFullYear()} Shift. All rights reserved.
          </p>
        </div>
      </div>
    </footer>
  );
}

function FooterLinks({ links }: { links: { label: string; to: string }[] }) {
  return (
    <ul className="space-y-2">
      {links.map((link) => (
        <li key={link.to}>
          <Link
            to={link.to}
            className="text-gray-500 hover:text-gray-900 transition-colors text-sm"
          >
            {link.label}
          </Link>
        </li>
      ))}
    </ul>
  );
}
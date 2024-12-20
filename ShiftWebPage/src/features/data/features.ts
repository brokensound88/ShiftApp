import { Feature } from '../types';

export const features: Record<string, Feature> = {
  microtransactions: {
    id: 'microtransactions',
    title: 'Microtransactions',
    description: 'Process payments as low as $0.01 with near-zero fees',
    icon: 'Zap',
    content: {
      overview: 'Enable new business models with ultra-low-cost payment processing powered by smart contracts.',
      benefits: [
        'Process payments as low as $0.01 with minimal fees',
        'Instant settlement for all transaction sizes',
        'Automated batching for maximum efficiency',
        'Perfect for subscriptions and usage-based pricing'
      ],
      details: [
        'Smart contract-based fee optimization',
        'Automated payment batching',
        'Real-time settlement confirmation',
        'Custom fee structures'
      ]
    }
  },
  security: {
    id: 'security',
    title: 'Security & Transparency',
    description: 'Built on blockchain technology for maximum security',
    icon: 'Lock',
    content: {
      overview: 'Enterprise-grade security with complete transparency and auditability.',
      benefits: [
        'Multi-signature wallet protection',
        'Real-time fraud detection',
        'Automated compliance checks',
        'Complete audit trail'
      ],
      details: [
        'Multi-factor authentication',
        'Hardware security module integration',
        'Automated security monitoring',
        'Regular security audits'
      ]
    }
  },
  global: {
    id: 'global',
    title: 'Global Reach',
    description: 'Send payments anywhere instantly',
    icon: 'Globe2',
    content: {
      overview: 'Send and receive payments anywhere in the world with instant settlement and minimal fees.',
      benefits: [
        'Support for 180+ countries',
        '24/7 instant transfers globally',
        'Automatic currency conversion',
        'Local payment method support'
      ],
      details: [
        'Global payment network integration',
        'Cross-border payment optimization',
        'Regional compliance handling',
        'Local banking partnerships'
      ]
    }
  },
  currencies: {
    id: 'currencies',
    title: 'Multi-Currency Support',
    description: 'Support for major cryptocurrencies and fiat',
    icon: 'Coins',
    content: {
      overview: 'Accept and process payments in any major cryptocurrency or fiat currency.',
      benefits: [
        'Support for major cryptocurrencies (BTC, ETH)',
        'Stablecoin integration (USDC, USDT)',
        '150+ fiat currencies',
        'Real-time exchange rates'
      ],
      details: [
        'Automated currency conversion',
        'Multi-currency wallet management',
        'Exchange rate optimization',
        'Currency risk management'
      ]
    }
  },
  analytics: {
    id: 'analytics',
    title: 'Advanced Analytics',
    description: 'Real-time tracking and reporting',
    icon: 'BarChart',
    content: {
      overview: 'Gain deep insights into your payment flows with comprehensive analytics.',
      benefits: [
        'Real-time transaction monitoring',
        'Custom report generation',
        'Trend analysis and forecasting',
        'Performance metrics and KPIs'
      ],
      details: [
        'Real-time data processing',
        'Custom dashboard creation',
        'Advanced data visualization',
        'Automated reporting system'
      ]
    }
  },
  wallets: {
    id: 'wallets',
    title: 'Wallet Integration',
    description: 'Connect with popular crypto wallets',
    icon: 'Wallet',
    content: {
      overview: 'Connect seamlessly with popular crypto wallets and payment systems.',
      benefits: [
        'MetaMask integration',
        'WalletConnect support',
        'Hardware wallet compatibility',
        'Multi-wallet management'
      ],
      details: [
        'Secure wallet connection',
        'Transaction signing',
        'Balance management',
        'Address validation'
      ]
    }
  }
};
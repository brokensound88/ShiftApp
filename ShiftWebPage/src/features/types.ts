export interface Feature {
  id: string;
  title: string;
  description: string;
  icon: string;
  content: {
    overview: string;
    benefits: string[];
    details: string[];
  };
}
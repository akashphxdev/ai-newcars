// src/modules/newCars/faq/faq.types.ts

export interface FaqModelSummary {
  id: number;
  name: string;
  brand: { id: number; name: string };
}

export interface FaqRecord {
  id: number;
  modelId: number;
  question: string;
  answer: string;
  displayOrder: number;
  isActive: boolean;
  createdAt: Date;
  model: FaqModelSummary;
}
import { create } from 'zustand';

interface StockSelectionState {
  selectedStock: string | null;
  setSelectedStock: (symbol: string | null) => void;
}

export const useStockSelection = create<StockSelectionState>((set) => ({
  selectedStock: null,
  setSelectedStock: (symbol) => set({ selectedStock: symbol }),
}));
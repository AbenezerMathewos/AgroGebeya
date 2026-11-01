import { createContext, useContext, useState, useEffect } from 'react';

const CurrencyUnitContext = createContext(null);

// Exchange rate approximate: 1 USD ~ 130 ETB
const USD_RATE = 130;

export function CurrencyUnitProvider({ children }) {
  const [currency, setCurrency] = useState(() => {
    return localStorage.getItem('agrogebeya_currency') || 'ETB';
  });

  const [unitMode, setUnitMode] = useState(() => {
    return localStorage.getItem('agrogebeya_unit') || 'Quintal';
  });

  useEffect(() => {
    localStorage.setItem('agrogebeya_currency', currency);
  }, [currency]);

  useEffect(() => {
    localStorage.setItem('agrogebeya_unit', unitMode);
  }, [unitMode]);

  // Convert ETB to active currency
  const formatPrice = (etbAmount) => {
    if (!etbAmount || isNaN(etbAmount)) return '0';
    if (currency === 'USD') {
      const usd = (etbAmount / USD_RATE).toFixed(2);
      return `$${Number(usd).toLocaleString()}`;
    }
    return `${Number(etbAmount).toLocaleString()} ETB`;
  };

  const toggleCurrency = () => {
    setCurrency((prev) => (prev === 'ETB' ? 'USD' : 'ETB'));
  };

  return (
    <CurrencyUnitContext.Provider
      value={{
        currency,
        setCurrency,
        toggleCurrency,
        unitMode,
        setUnitMode,
        formatPrice,
        usdRate: USD_RATE,
      }}
    >
      {children}
    </CurrencyUnitContext.Provider>
  );
}

export function useCurrencyUnit() {
  const context = useContext(CurrencyUnitContext);
  if (!context) {
    throw new Error('useCurrencyUnit must be used within a CurrencyUnitProvider');
  }
  return context;
}

import React, { useEffect, useState } from 'react';
import { useCurrency } from '../../contexts/CurrencyContext';
import { convertAndFormat, formatCurrency } from '../../utils/api';

const Money = ({ amount, currency: itemCurrency }) => {
  const { currency: targetCurrency } = useCurrency();
  const [label, setLabel] = useState(() => formatCurrency(amount || 0, itemCurrency || 'USD'));

  useEffect(() => {
    let mounted = true;
    const convert = async () => {
      try {
        if (!itemCurrency) {
          setLabel(formatCurrency(amount || 0, targetCurrency || 'USD'));
          return;
        }
        const formatted = await convertAndFormat(amount || 0, itemCurrency || 'USD', targetCurrency || 'USD');
        if (mounted) setLabel(formatted);
      } catch (e) {
        if (mounted) setLabel(formatCurrency(amount || 0, itemCurrency || 'USD'));
      }
    };
    convert();
    return () => { mounted = false; };
  }, [amount, itemCurrency, targetCurrency]);

  return <>{label}</>;
};

export default Money;

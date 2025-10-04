import React from 'react';
import { calculatePasswordStrength } from '../../utils/validation';

const PasswordStrengthIndicator = ({ password }) => {
  const { strength, score } = calculatePasswordStrength(password);

  if (!password) return null;

  const getStrengthColor = () => {
    switch (strength) {
      case 'weak': return 'bg-red-500';
      case 'medium': return 'bg-yellow-500';
      case 'strong': return 'bg-green-500';
      default: return 'bg-gray-300';
    }
  };

  const getStrengthText = () => {
    switch (strength) {
      case 'weak': return 'Weak';
      case 'medium': return 'Medium';
      case 'strong': return 'Strong';
      default: return '';
    }
  };

  const getStrengthTextColor = () => {
    switch (strength) {
      case 'weak': return 'text-red-600';
      case 'medium': return 'text-yellow-600';
      case 'strong': return 'text-green-600';
      default: return 'text-gray-500';
    }
  };

  return (
    <div className="mt-2">
      <div className="flex space-x-1 mb-2">
        {[1, 2, 3, 4, 5].map((level) => (
          <div
            key={level}
            className={`h-2 w-full rounded ${
              level <= score ? getStrengthColor() : 'bg-gray-200'
            }`}
          />
        ))}
      </div>
      <p className={`text-sm font-medium ${getStrengthTextColor()}`}>
        Password strength: {getStrengthText()}
      </p>
    </div>
  );
};

export default PasswordStrengthIndicator;
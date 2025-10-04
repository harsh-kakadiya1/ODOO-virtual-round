import React from 'react';
import { Link, useLocation } from 'react-router-dom';
import { 
  Home, 
  Receipt, 
  CheckCircle, 
  Users, 
  Building2, 
  User,
  X
} from 'lucide-react';
import { useAuth } from '../../contexts/AuthContext';
import { useCurrency } from '../../contexts/CurrencyContext';
import { clsx } from 'clsx';

const Sidebar = ({ onClose }) => {
  const location = useLocation();
  const { user, hasRole } = useAuth();
  const { currency } = useCurrency();

  const navigation = [
    {
      name: 'Dashboard',
      href: '/dashboard',
      icon: Home,
      roles: ['employee', 'manager', 'admin']
    },
    {
      name: 'Expenses',
      href: '/expenses',
      icon: Receipt,
      roles: ['employee', 'manager', 'admin']
    },
    {
      name: 'Approvals',
      href: '/approvals',
      icon: CheckCircle,
      roles: ['manager', 'admin']
    },
    {
      name: 'Users',
      href: '/users',
      icon: Users,
      roles: ['admin']
    },
    {
      name: 'Company',
      href: '/company',
      icon: Building2,
      roles: ['admin']
    },
    {
      name: 'Profile',
      href: '/profile',
      icon: User,
      roles: ['employee', 'manager', 'admin']
    }
  ];

  const filteredNavigation = navigation.filter(item => 
    hasRole(item.roles)
  );

  const isActive = (href) => {
    return location.pathname === href || location.pathname.startsWith(href + '/');
  };

  return (
    <div className="flex flex-col h-full bg-white border-r border-gray-200">
      {/* Close button for mobile */}
      {onClose && (
        <div className="flex items-center justify-between p-4 border-b border-gray-200">
          <h2 className="text-lg font-semibold text-gray-900">Menu</h2>
          <button
            onClick={onClose}
            className="p-2 rounded-md text-gray-400 hover:text-gray-500 hover:bg-gray-100"
          >
            <X className="h-5 w-5" />
          </button>
        </div>
      )}

      {/* Company info */}
      <div className="p-4 border-b border-gray-200">
        <div className="flex items-center space-x-3">
          <div className="h-8 w-8 bg-primary-100 rounded-lg flex items-center justify-center">
            <Building2 className="h-4 w-4 text-primary-600" />
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-sm font-medium text-gray-900 truncate">
              {user?.company?.name}
            </p>
            <p className="text-xs text-gray-500">
              {currency || user?.company?.currency}
            </p>
          </div>
        </div>
      </div>

      {/* Navigation */}
      <nav className="flex-1 px-4 py-4 space-y-1">
        {filteredNavigation.map((item) => {
          const Icon = item.icon;
          return (
            <Link
              key={item.name}
              to={item.href}
              onClick={onClose}
              className={clsx(
                'group flex items-center px-3 py-2 text-sm font-medium rounded-md transition-colors',
                isActive(item.href)
                  ? 'bg-primary-100 text-primary-700'
                  : 'text-gray-600 hover:bg-gray-50 hover:text-gray-900'
              )}
            >
              <Icon
                className={clsx(
                  'mr-3 h-5 w-5 flex-shrink-0',
                  isActive(item.href)
                    ? 'text-primary-500'
                    : 'text-gray-400 group-hover:text-gray-500'
                )}
              />
              {item.name}
            </Link>
          );
        })}
      </nav>

      {/* User info */}
      <div className="p-4 border-t border-gray-200">
        <div className="flex items-center space-x-3">
          <div className="h-8 w-8 bg-gray-200 rounded-full flex items-center justify-center">
            <User className="h-4 w-4 text-gray-600" />
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-sm font-medium text-gray-900 truncate">
              {user?.firstName} {user?.lastName}
            </p>
            <p className="text-xs text-gray-500 capitalize">
              {user?.role}
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Sidebar;

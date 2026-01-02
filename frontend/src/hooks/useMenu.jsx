import { useAuth } from '../contexts/AuthContext';
import {
    FiHome,
    FiUsers,
    FiShield,
    FiPackage,
    FiMapPin,
    FiTool,
    FiSettings,
    FiActivity,
    FiTruck,
} from 'react-icons/fi';

export const useMenu = () => {
    const { hasPermission, hasModule } = useAuth();
    const activeModule = localStorage.getItem('activeModule');

    const getDashboardPath = () => {
        if (activeModule === 'sysadmin') return '/sysadmin/dashboard';
        if (activeModule === 'asset') return '/asset/dashboard';
        return '/dashboard'; // Fallback
    };

    const menuItems = [
        {
            title: 'Dashboard',
            path: getDashboardPath(),
            icon: <FiHome />,
            show: true,
        },
        // Sysadmin Module
        {
            title: 'System Admin',
            module: 'sysadmin',
            icon: <FiSettings />,
            show: hasModule('sysadmin') && (!activeModule || activeModule === 'sysadmin'),
            children: [
                {
                    title: 'Users',
                    path: '/sysadmin/users',
                    icon: <FiUsers />,
                    show: hasPermission('sysadmin.users.view'),
                    group: 'Master',
                },
                {
                    title: 'Roles',
                    path: '/sysadmin/roles',
                    icon: <FiShield />,
                    show: hasPermission('sysadmin.roles.view'),
                    group: 'Master',
                },
                {
                    title: 'Activity Logs',
                    path: '/sysadmin/logs',
                    icon: <FiActivity />,
                    show: hasPermission('sysadmin.logs.view'),
                    group: 'Transaksi',
                },
            ],
        },
        // Asset Management Module
        {
            title: 'Asset Management',
            module: 'asset',
            icon: <FiPackage />,
            show: hasModule('asset') && (!activeModule || activeModule === 'asset'),
            children: [
                {
                    title: 'Assets',
                    path: '/asset/items',
                    icon: <FiPackage />,
                    show: hasPermission('asset.items.view'),
                    group: 'Main',
                },
                {
                    title: 'Credentials',
                    path: '/asset/credentials',
                    icon: <FiShield />,
                    show: hasPermission('asset.credentials.view'),
                    group: 'Main',
                },
                {
                    title: 'Asset Categories',
                    path: '/asset/categories',
                    icon: <FiTool />,
                    show: hasPermission('asset.categories.manage'),
                    group: 'Master',
                },
                {
                    title: 'Asset Locations',
                    path: '/asset/locations',
                    icon: <FiMapPin />,
                    show: hasPermission('asset.locations.manage'),
                    group: 'Master',
                },
                {
                    title: 'Asset Suppliers',
                    path: '/asset/suppliers',
                    icon: <FiTruck />,
                    show: hasPermission('asset.suppliers.manage'),
                    group: 'Master',
                },
                {
                    title: 'Credential Categories',
                    path: '/asset/credential-categories',
                    icon: <FiShield />,
                    show: hasPermission('asset.credentials.manage'),
                    group: 'Master',
                },
                {
                    title: 'Maintenance',
                    path: '/asset/maintenance',
                    icon: <FiTool />,
                    show: hasPermission('asset.maintenance.view'),
                    group: 'Transaction',
                },
            ],
        },
    ];

    return menuItems;
};

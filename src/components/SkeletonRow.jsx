import React from 'react';

const SkeletonRow = () => (
    <tr className="animate-pulse">
        <td className="px-6 py-4">
            <div className="h-4 bg-gray-300 dark:bg-gray-700 rounded w-3/4"></div>
            <div className="h-3 bg-gray-200 dark:bg-gray-800 rounded w-1/2 mt-2"></div>
        </td>
        <td className="px-6 py-4">
            <div className="h-6 bg-gray-300 dark:bg-gray-700 rounded-full w-20"></div>
        </td>
        <td className="px-6 py-4">
            <div className="h-4 bg-gray-300 dark:bg-gray-700 rounded w-24"></div>
        </td>
        <td className="px-6 py-4">
            <div className="h-4 bg-gray-300 dark:bg-gray-700 rounded w-20"></div>
        </td>
    </tr>
);

export default SkeletonRow;
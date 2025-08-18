import React from 'react';
import { ZapIcon, PlusCircleIcon } from './Icons';
import Button from './Button';

const EmptyState = ({ title, message, actionText, onAction }) => (
    <div className="text-center py-16">
        <ZapIcon className="mx-auto h-12 w-12 text-gray-400 dark:text-gray-600" />
        <h3 className="mt-4 text-lg font-semibold text-gray-900 dark:text-white">{title}</h3>
        <p className="text-sm text-gray-500 dark:text-gray-400">{message}</p>
        {onAction && (
            <div className="mt-6">
                <Button onClick={onAction}>
                    <PlusCircleIcon className="h-5 w-5 mr-2" />
                    {actionText}
                </Button>
            </div>
        )}
    </div>
);

export default EmptyState;
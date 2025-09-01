// src/components/Avatar.jsx

import React, { useState, useEffect } from 'react';
import { cn } from '../utils';

// --- COMPONENTE AVATAR 100% REFEITO E ROBUSTO ---

export const Avatar = ({ src, fallbackText, alt = '', className }) => {
    const [imageError, setImageError] = useState(false);

    // Se a `src` da imagem mudar (ex: usuário faz novo upload),
    // resetamos o estado de erro para tentar carregar a nova imagem.
    useEffect(() => {
        setImageError(false);
    }, [src]);

    const handleImageError = () => {
        // Esta função é chamada se o navegador não conseguir carregar a imagem.
        setImageError(true);
    };

    // A imagem só deve ser mostrada se a URL (src) existir E se não tiver dado erro.
    const showImage = src && !imageError;

    return (
        <div className={cn(
            "relative flex h-10 w-10 shrink-0 overflow-hidden rounded-full items-center justify-center",
            className
        )}>
            {showImage ? (
                <img 
                    src={src} 
                    alt={alt}
                    onError={handleImageError} // Se a imagem falhar, chama nossa função
                    className="aspect-square h-full w-full object-cover object-center"
                />
            ) : (
                <span className="flex h-full w-full items-center justify-center rounded-full bg-gray-200 dark:bg-gray-700 font-bold text-gray-600 dark:text-gray-300">
                    {fallbackText}
                </span>
            )}
        </div>
    );
};

export default Avatar;
// Não precisamos mais de AvatarImage e AvatarFallback separados.
// O componente Avatar agora cuida de tudo.
import { useState, useEffect } from 'react';
import { useData } from '../contexts/DataContext';

// CORREÇÃO: Removido o "export" da linha da constante
export const useNavigation = () => {
    const [page, setPage] = useState('dashboard');
    const [selectedItemId, setSelectedItemId] = useState(null);
    const [pageOptions, setPageOptions] = useState({});
    const [itemDetails, setItemDetails] = useState(null);
    const data = useData();

    const handleNavigate = (targetPage, itemId = null, options = {}) => {
        setPage(targetPage);
        setSelectedItemId(itemId);
        setPageOptions(options);
    };

    useEffect(() => {
        if (selectedItemId) {
            let item = null;
            if (page === 'client-details' || page === 'edit-client') {
                item = data.getClientById(selectedItemId); 
            } else if (page === 'convert-lead') {
                item = data.leads.find(l => l.id === selectedItemId);
            } else if (page === 'convert-production') {
                item = data.productions.find(p => p.id === selectedItemId);
            }
            setItemDetails(item);
        } else {
            setItemDetails(null);
        }
    }, [selectedItemId, page, data]);

    return {
        page,
        selectedItemId,
        pageOptions,
        itemDetails,
        handleNavigate,
    };
};

// CORREÇÃO: Adicionada a exportação padrão no final
export default useNavigation;
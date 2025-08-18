import React, { useMemo } from 'react';
import { useData } from '../../contexts/DataContext';
import FormSection from './FormSection'; // CORREÇÃO: Importado como default
import Label from '../Label';
import Select from '../Select';

// CORREÇÃO: Alterado de "export const" para uma constante simples
const InternalDataForm = ({ formData, handleChange }) => {
    const { users, partners } = useData();

    const allBrokers = useMemo(() => {
        const internal = users.filter(u => u.permissionLevel === 'Corretor').map(u => ({ id: u.id, name: u.name }));
        const external = partners.filter(p => p.type === 'Corretor').map(p => ({ id: p.id, name: `${p.name} (Parceiro)` }));
        return [...internal, ...external].sort((a, b) => a.name.localeCompare(b.name));
    }, [users, partners]);

    const allSupervisors = useMemo(() => {
        const internal = users.filter(u => u.permissionLevel === 'Supervisor').map(u => ({ id: u.id, name: u.name }));
        const external = partners.filter(p => p.type === 'Supervisor').map(p => ({ id: p.id, name: `${p.name} (Parceiro)` }));
        return [...internal, ...external].sort((a, b) => a.name.localeCompare(b.name));
    }, [users, partners]);

    return (
        <FormSection title="Dados Internos e Gestão" cols={2}>
            <div>
                <Label>Corretor Responsável</Label>
                <Select name="internal.brokerId" value={formData?.internal?.brokerId || ''} onChange={handleChange}>
                    <option value="">Selecione...</option>
                    {allBrokers.map(u => <option key={u.id} value={u.id}>{u?.name}</option>)}
                </Select>
            </div>
            <div>
                <Label>Supervisor</Label>
                <Select name="internal.supervisorId" value={formData?.internal?.supervisorId || ''} onChange={handleChange}>
                    <option value="">Selecione...</option>
                    {allSupervisors.map(u => <option key={u.id} value={u.id}>{u?.name}</option>)}
                </Select>
            </div>
        </FormSection>
    );
};

export default InternalDataForm;
import React, { useMemo } from 'react';
import { useData } from '/src/contexts/DataContext';
import FormSection from '/src/components/forms/FormSection';
import Label from '/src/components/Label';
import { Select, SelectItem } from '/src/components/Select';

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

    const handleSelectChange = (name, value) => {
        const event = {
            target: {
                name: name,
                value: value
            }
        };
        handleChange(event);
    };

    return (
        <FormSection title="Dados Internos e Gestão" cols={2}>
            <div>
                <Label>Corretor Responsável</Label>
                <Select
                    name="internal.brokerId"
                    value={formData?.internal?.brokerId || ''}
                    onValue-change={(value) => handleSelectChange('internal.brokerId', value)}
                >
                    {allBrokers.map(u => <SelectItem key={u.id} value={u.id}>{u.name}</SelectItem>)}
                </Select>
            </div>
            <div>
                <Label>Supervisor</Label>
                <Select
                    name="internal.supervisorId"
                    value={formData?.internal?.supervisorId || ''}
                    onValue-change={(value) => handleSelectChange('internal.supervisorId', value)}
                >
                    {allSupervisors.map(u => <SelectItem key={u.id} value={u.id}>{u.name}</SelectItem>)}
                </Select>
            </div>
        </FormSection>
    );
};

export default InternalDataForm;


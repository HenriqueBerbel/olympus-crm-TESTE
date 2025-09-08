import React, { useState, useEffect, useMemo } from 'react';
import { calculateAge } from '../../utils';
import Modal from '../Modal';
import Label from '../Label';
import Input from '../Input';
import Select from '../Select';
import DateField from '../DateField';
import Button from '../Button';
import { useToast } from '../../contexts/NotificationContext';

const BeneficiaryModal = ({ isOpen, onClose, onSave, beneficiary }) => {
    const { toast } = useToast();

    const getInitialFormState = () => ({
        id: null, name: '', cpf: '', dob: '', kinship: 'Titular',
        weight: '', height: '', idCardNumber: '',
        credentials: { appLogin: '', appPassword: '' }
    });

    const [formState, setFormState] = useState(getInitialFormState());
    const [isSaving, setIsSaving] = useState(false);
    const kinshipOptions = ["Titular", "Pai", "Mãe", "Tia", "Tio", "Avô", "Avó", "Filho(a)", "Esposa", "Marido", "Sobrinho(a)", "Neto(a)", "Outro"];

    // Efeito para popular/limpar o formulário quando o modal abre/fecha
    useEffect(() => {
        if (isOpen) {
            setFormState(beneficiary ? { ...getInitialFormState(), ...beneficiary } : getInitialFormState());
        } else {
            // Garante a limpeza completa ao fechar
            setFormState(getInitialFormState());
            setIsSaving(false);
        }
    }, [isOpen, beneficiary]);

    // MELHORIA: useMemo para cálculos derivados, mais performático que useEffect
    const age = useMemo(() => {
        return formState.dob ? calculateAge(formState.dob) : null;
    }, [formState.dob]);

    const imc = useMemo(() => {
        const weight = parseFloat(formState.weight);
        const height = parseFloat(formState.height);

        if (weight > 0 && height > 0) {
            const heightInMeters = height / 100;
            const imcValue = weight / (heightInMeters * heightInMeters);
            let classification = '';
            if (imcValue < 18.5) classification = 'Abaixo do peso';
            else if (imcValue < 25) classification = 'Normal';
            else if (imcValue < 30) classification = 'Sobrepeso';
            else classification = 'Obesidade';
            return { value: imcValue.toFixed(2), classification };
        }
        return { value: null, classification: '' };
    }, [formState.weight, formState.height]);

    const handleChange = (e) => {
        const { name, value } = e.target;
        if (name.includes('.')) {
            const [parent, child] = name.split('.');
            setFormState(p => ({ ...p, [parent]: { ...p[parent], [child]: value } }));
        } else {
            setFormState(p => ({ ...p, [name]: value }));
        }
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        if (isSaving) return;

        if (!formState.name || !formState.dob) {
            toast({ title: "Campos obrigatórios", description: "Nome e Data de Nascimento são obrigatórios.", variant: "destructive" });
            return;
        }

        setIsSaving(true);
        try {
            await onSave(formState);
        } catch (error) {
            console.error("Falha ao salvar beneficiário:", error);
            toast({ title: "Erro ao Salvar", description: "Não foi possível salvar os dados. Tente novamente.", variant: "destructive" });
        } finally {
            setIsSaving(false);
        }
    };

    return (
        <Modal 
            isOpen={isOpen} 
            onClose={onClose} 
            title={beneficiary ? "Editar Beneficiário" : "Adicionar Beneficiário"}
            closeOnClickOutside={false}
        >
            <form onSubmit={handleSubmit} className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div><Label htmlFor="b-name">Nome Completo</Label><Input id="b-name" name="name" value={formState.name} onChange={handleChange} required disabled={isSaving}/></div>
                    <div><Label htmlFor="b-cpf">CPF</Label><Input id="b-cpf" name="cpf" value={formState.cpf} onChange={handleChange} disabled={isSaving}/></div>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 items-end">
                    <div><Label htmlFor="b-dob">Data de Nascimento</Label><DateField id="b-dob" name="dob" value={formState.dob} onChange={handleChange} required disabled={isSaving}/></div>
                    {age !== null && <div><Label>Idade</Label><p className="h-10 flex items-center px-3 text-gray-700 dark:text-gray-300">{age} anos</p></div>}
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 items-end">
                    <div><Label htmlFor="b-weight">Peso (kg)</Label><Input id="b-weight" type="number" name="weight" value={formState.weight} onChange={handleChange} placeholder="Ex: 70" disabled={isSaving}/></div>
                    <div><Label htmlFor="b-height">Altura (cm)</Label><Input id="b-height" type="number" name="height" value={formState.height} onChange={handleChange} placeholder="Ex: 175" disabled={isSaving}/></div>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 items-end">
                    <div><Label>IMC</Label><p className="h-10 flex items-center px-3 text-gray-700 dark:text-gray-300">{imc.value ? `${imc.value} - ${imc.classification}` : 'N/D'}</p></div>
                    <div><Label htmlFor="b-kinship">Parentesco</Label><Select id="b-kinship" name="kinship" value={formState.kinship} onChange={handleChange} required disabled={isSaving}>{kinshipOptions.map(opt => <option key={opt} value={opt}>{opt}</option>)}</Select></div>
                </div>
                <div><Label htmlFor="b-idCard">Número da Carteirinha</Label><Input id="b-idCard" name="idCardNumber" value={formState.idCardNumber || ''} onChange={handleChange} disabled={isSaving}/></div>
                
                <h4 className="text-md font-semibold text-cyan-600 dark:text-cyan-400/80 border-t border-gray-200 dark:border-white/10 pt-4 mt-4">Credenciais do Beneficiário</h4>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div><Label htmlFor="b-login">Login do App</Label><Input id="b-login" name="credentials.appLogin" value={formState.credentials?.appLogin || ''} onChange={handleChange} disabled={isSaving}/></div>
                    <div><Label htmlFor="b-pass">Senha do App</Label><Input id="b-pass" type="text" name="credentials.appPassword" value={formState.credentials?.appPassword || ''} onChange={handleChange} disabled={isSaving}/></div>
                </div>
                
                <div className="flex justify-end gap-4 pt-4 border-t border-gray-200 dark:border-white/10 mt-6">
                    <Button type="button" variant="outline" onClick={onClose} disabled={isSaving}>Cancelar</Button>
                    <Button type="submit" disabled={isSaving}>{isSaving ? 'Salvando...' : 'Salvar'}</Button>
                </div>
            </form>
        </Modal>
    );
};

export default BeneficiaryModal;
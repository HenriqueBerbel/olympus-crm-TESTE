import React, { useState, useEffect } from 'react';
import { calculateAge } from '../../utils';
import Modal from '../Modal';
import Label from '../Label';
import Input from '../Input';
import Select from '../Select';
import DateField from '../DateField';
import Button from '../Button';

// CORREÇÃO: Alterado de "export const" para uma constante
const BeneficiaryModal = ({ isOpen, onClose, onSave, beneficiary }) => {
    const getInitialFormState = () => ({
        id: null, name: '', cpf: '', dob: '', kinship: 'Titular',
        weight: '', height: '', idCardNumber: '',
        credentials: { appLogin: '', appPassword: '' }
    });

    const [formState, setFormState] = useState(getInitialFormState());
    const [age, setAge] = useState(null);
    const [imc, setImc] = useState({ value: null, classification: '' });
    const kinshipOptions = ["Titular", "Pai", "Mãe", "Tia", "Tio", "Avô", "Avó", "Filho(a)", "Esposa", "Marido", "Sobrinho(a)", "Neto(a)", "Outro"];

    useEffect(() => {
        if (isOpen) {
            setFormState(beneficiary ? { ...getInitialFormState(), ...beneficiary } : getInitialFormState());
        } else {
            setAge(null);
            setImc({ value: null, classification: '' });
        }
    }, [beneficiary, isOpen]);

    useEffect(() => {
        setAge(formState.dob ? calculateAge(formState.dob) : null);
    }, [formState.dob]);

    useEffect(() => {
        const weight = parseFloat(formState.weight);
        const height = parseFloat(formState.height);
        if (weight > 0 && height > 0) {
            const heightInMeters = height / 100;
            const imcValue = weight / (heightInMeters * heightInMeters);
            let classification = '';
            if (imcValue < 18.5) classification = 'Abaixo do peso';
            else if (imcValue >= 18.5 && imcValue <= 24.9) classification = 'Normal';
            else if (imcValue >= 25 && imcValue <= 29.9) classification = 'Sobrepeso';
            else if (imcValue >= 30) classification = 'Obesidade';
            setImc({ value: imcValue.toFixed(2), classification });
        } else {
            setImc({ value: null, classification: '' });
        }
    }, [formState.weight, formState.height]);

    const handleChange = (e) => {
        const { name, value } = e.target;
        if (name.includes('.')) {
            const [parent, child] = name.split('.');
            setFormState(p => ({ ...p, [parent]: { ...p[parent], [child]: value } }));
        } else {
            let cleanValue = value;
            if (name === 'height' || name === 'weight') {
                cleanValue = value.replace(/[^0-9]/g, '');
            }
            setFormState(p => ({ ...p, [name]: cleanValue }));
        }
    };

    const handleSubmit = (e) => {
        e.preventDefault();
        onSave(formState);
    };

    return (
        <Modal isOpen={isOpen} onClose={onClose} title={beneficiary ? "Editar Beneficiário" : "Adicionar Beneficiário"}>
            <form onSubmit={handleSubmit} className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div><Label>Nome Completo</Label><Input name="name" value={formState.name} onChange={handleChange} required /></div>
                    <div><Label>CPF</Label><Input name="cpf" value={formState.cpf} onChange={handleChange} /></div>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div><Label>Data de Nascimento</Label><DateField name="dob" value={formState.dob} onChange={handleChange} required /></div>
                    {age !== null && <div className="mt-2"><Label>Idade</Label><p className="h-10 flex items-center px-3 text-gray-700 dark:text-gray-300">{age} anos</p></div>}
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div><Label>Peso (kg)</Label><Input type="number" name="weight" value={formState.weight} onChange={handleChange} placeholder="Ex: 70" /></div>
                    <div><Label>Altura (cm)</Label><Input type="number" name="height" value={formState.height} onChange={handleChange} placeholder="Ex: 175 (em cm)" /></div>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div><Label>IMC</Label><p className="h-10 flex items-center px-3 text-gray-700 dark:text-gray-300">{imc.value ? `${imc.value} - ${imc.classification}` : 'N/D'}</p></div>
                    <div><Label>Parentesco</Label><Select name="kinship" value={formState.kinship} onChange={handleChange} required>{kinshipOptions.map(opt => <option key={opt} value={opt}>{opt}</option>)}</Select></div>
                </div>
                <div><Label>Número da Carteirinha</Label><Input name="idCardNumber" value={formState.idCardNumber} onChange={handleChange} /></div>
                <h4 className="text-md font-semibold text-cyan-600 dark:text-cyan-400/80 border-t pt-4 mt-4">Credenciais do Beneficiário</h4>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div><Label>Login do App</Label><Input name="credentials.appLogin" value={formState.credentials?.appLogin || ''} onChange={handleChange} /></div>
                    <div><Label>Senha do App</Label><Input type="text" name="credentials.appPassword" value={formState.credentials?.appPassword || ''} onChange={handleChange} /></div>
                </div>
                <div className="flex justify-end gap-4 pt-4">
                    <Button type="button" variant="outline" onClick={onClose}>Cancelar</Button>
                    <Button type="submit">Salvar</Button>
                </div>
            </form>
        </Modal>
    );
};

export default BeneficiaryModal;
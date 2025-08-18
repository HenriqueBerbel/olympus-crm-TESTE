import { clsx } from "clsx"
import { twMerge } from "tailwind-merge"

export function cn(...inputs) {
  return twMerge(clsx(inputs))
}

export const calculateAge = (dob) => {
    if (!dob || !/^\d{4}-\d{2}-\d{2}$/.test(dob)) {
        return null;
    }
    const birthDate = new Date(dob + 'T00:00:00');
    const today = new Date();
    let age = today.getFullYear() - birthDate.getFullYear();
    const m = today.getMonth() - birthDate.getMonth();
    if (m < 0 || (m === 0 && today.getDate() < birthDate.getDate())) {
        age--;
    }
    return age;
};

export const formatDate = (dateString) => {
    if (!dateString) return 'N/A';
    const date = new Date(dateString + 'T00:00:00');
    return date.toLocaleDateString('pt-BR');
};

export const formatDateTime = (timestamp) => {
    if (timestamp && typeof timestamp.toDate === 'function') {
        return timestamp.toDate().toLocaleString('pt-BR', { dateStyle: 'short', timeStyle: 'short' });
    }
    return 'N/A';
};

export const formatCurrency = (value) => {
    const numberValue = Number(value) || 0;
    return new Intl.NumberFormat('pt-BR', {
        style: 'currency',
        currency: 'BRL',
    }).format(numberValue);
};

const mask = (value, pattern) => {
    let i = 0;
    const v = value.toString().replace(/\D/g, '');
    if (!v) return '';
    return pattern.replace(/#/g, () => v[i++] || '').slice(0, pattern.lastIndexOf('#') + 1);
};

export const maskCPF = (value) => mask(value, '###.###.###-##');
export const maskCNPJ = (value) => mask(value, '##.###.###/####-##');
export const maskCEP = (value) => mask(value, '#####-###');

export const validateCNPJ = (cnpj) => {
    cnpj = cnpj.replace(/[^\d]+/g, '');
    if (cnpj === '' || cnpj.length !== 14 || /^(\d)\1+$/.test(cnpj)) return false;
    let tamanho = cnpj.length - 2;
    let numeros = cnpj.substring(0, tamanho);
    let digitos = cnpj.substring(tamanho);
    let soma = 0;
    let pos = tamanho - 7;
    for (let i = tamanho; i >= 1; i--) {
        soma += numeros.charAt(tamanho - i) * pos--;
        if (pos < 2) pos = 9;
    }
    let resultado = soma % 11 < 2 ? 0 : 11 - soma % 11;
    if (resultado != digitos.charAt(0)) return false;
    tamanho = tamanho + 1;
    numeros = cnpj.substring(0, tamanho);
    soma = 0;
    pos = tamanho - 7;
    for (let i = tamanho; i >= 1; i--) {
        soma += numeros.charAt(tamanho - i) * pos--;
        if (pos < 2) pos = 9;
    }
    resultado = soma % 11 < 2 ? 0 : 11 - soma % 11;
    if (resultado != digitos.charAt(1)) return false;
    return true;
};

export const validateCPF = (cpf) => {
    cpf = cpf.replace(/[^\d]+/g, '');
    if (cpf === '' || cpf.length !== 11 || /^(\d)\1+$/.test(cpf)) return false;
    let soma = 0;
    let resto;
    for (let i = 1; i <= 9; i++) soma = soma + parseInt(cpf.substring(i - 1, i)) * (11 - i);
    resto = (soma * 10) % 11;
    if ((resto === 10) || (resto === 11)) resto = 0;
    if (resto !== parseInt(cpf.substring(9, 10))) return false;
    soma = 0;
    for (let i = 1; i <= 10; i++) soma = soma + parseInt(cpf.substring(i - 1, i)) * (12 - i);
    resto = (soma * 10) % 11;
    if ((resto === 10) || (resto === 11)) resto = 0;
    if (resto !== parseInt(cpf.substring(10, 11))) return false;
    return true;
};

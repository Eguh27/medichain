import { Block } from '@/types';

export interface Contract {
  id: string;
  name: string;
  description: string;
  condition: string;
  action: string;
  value: number;
  isActive: boolean;
}

export interface ContractResult {
  contractName: string;
  triggered: boolean;
  action: string;
  value: number;
  description: string;
}

export const allContracts: Contract[] = [
  {
    id: 'emergency-insurance',
    name: 'EmergencyInsurance',
    description: 'Memberikan subsidi 80% dari biaya perawatan untuk kondisi emergency.',
    condition: 'condition contains "emergency"',
    action: 'Subsidi 80%',
    value: 80,
    isActive: true,
  },
  {
    id: 'senior-discount',
    name: 'SeniorDiscount',
    description: 'Memberikan diskon 20% dari biaya perawatan untuk pasien di atas 60 tahun.',
    condition: 'age > 60',
    action: 'Diskon 20%',
    value: 20,
    isActive: true,
  },
  {
    id: 'readmission-alert',
    name: 'ReadmissionAlert',
    description: 'Menambahkan biaya monitoring lanjutan jika pasien masuk kembali.',
    condition: 'readmission === "Yes"',
    action: 'Tambah monitoring 50 MED',
    value: 50,
    isActive: true,
  },
];

export function executeContracts(block: Block): ContractResult[] {
  const { age, condition, cost, readmission } = block.data;

  return allContracts
    .filter((contract) => contract.isActive)
    .map((contract) => {
      if (contract.id === 'emergency-insurance') {
        const triggered = condition.toLowerCase().includes('emergency');
        return {
          contractName: contract.name,
          triggered,
          action: contract.action,
          value: triggered ? cost * 0.8 : 0,
          description: contract.description,
        };
      }

      if (contract.id === 'senior-discount') {
        const triggered = age > 60;
        return {
          contractName: contract.name,
          triggered,
          action: contract.action,
          value: triggered ? cost * 0.2 : 0,
          description: contract.description,
        };
      }

      const triggered = readmission === 'Yes';
      return {
        contractName: contract.name,
        triggered,
        action: contract.action,
        value: triggered ? 50 : 0,
        description: contract.description,
      };
    });
}

import { apiFetch, unwrapData } from '../apiClient';

export async function getCustomerContracts(renterId) {
  if (renterId === undefined || renterId === null || renterId === '') return [];
  const payload = await apiFetch(`/api/contracts?renterId=${encodeURIComponent(renterId)}`);
  const contracts = unwrapData(payload);
  return Array.isArray(contracts) ? contracts : [];
}

export async function getContractById(contractId) {
  const payload = await apiFetch(`/api/contracts/${encodeURIComponent(contractId)}`);
  return unwrapData(payload);
}

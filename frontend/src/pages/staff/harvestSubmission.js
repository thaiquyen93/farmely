export async function submitHarvestOnce(inFlightRef, submit) {
  if (inFlightRef.current) return null;
  inFlightRef.current = true;
  try {
    return await submit();
  } finally {
    inFlightRef.current = false;
  }
}

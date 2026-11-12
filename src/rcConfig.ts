let _configured = false;

export function markRcConfigured(): void {
  _configured = true;
}

export function isRcConfigured(): boolean {
  return _configured;
}

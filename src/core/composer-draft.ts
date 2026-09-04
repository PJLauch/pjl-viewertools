export interface ComposerChange {
  previousText: string;
  insertedText: string;
}

export function appendToDraft(existingText: string, text: string): ComposerChange | null {
  const addition = text.trim();
  if (!addition) return null;
  const previousText = existingText.trim();
  return {
    previousText,
    insertedText: previousText ? `${previousText} ${addition}` : addition
  };
}

export function canUndoDraft(currentText: string, change: ComposerChange): boolean {
  return currentText.trim() === change.insertedText;
}

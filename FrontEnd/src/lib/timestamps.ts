export interface ClipSegment {
  startSeconds: number;
  endSeconds: number;
}

const TIMESTAMP_PATTERN = /^\d{1,2}:\d{2}(?::\d{2})?$/;

export const timestampToSeconds = (value: string): number => {
  const normalized = value.trim();
  if (!TIMESTAMP_PATTERN.test(normalized)) {
    throw new Error(`Timestamp invalido: ${value}`);
  }

  const parts = normalized.split(':').map(Number);
  if (parts.some((part) => Number.isNaN(part))) {
    throw new Error(`Timestamp invalido: ${value}`);
  }

  if (parts.length === 2) {
    const [minutes, seconds] = parts;
    if (seconds >= 60) {
      throw new Error(`Timestamp invalido: ${value}`);
    }
    return minutes * 60 + seconds;
  }

  const [hours, minutes, seconds] = parts;
  if (minutes >= 60 || seconds >= 60) {
    throw new Error(`Timestamp invalido: ${value}`);
  }
  return hours * 3600 + minutes * 60 + seconds;
};

const formatSeconds = (value: number): string => {
  const safeValue = Math.max(0, value);
  const hours = Math.floor(safeValue / 3600);
  const minutes = Math.floor((safeValue % 3600) / 60);
  const seconds = Math.floor(safeValue % 60);
  if (hours > 0) {
    return [hours, minutes, seconds].map((part) => String(part).padStart(2, '0')).join(':');
  }
  return [minutes, seconds].map((part) => String(part).padStart(2, '0')).join(':');
};

export const parseTimestampRanges = (rawInput: string, maxSegments = 10): ClipSegment[] => {
  const lines = rawInput
    .split('\n')
    .map((line) => line.trim())
    .filter(Boolean);

  if (lines.length === 0) {
    throw new Error('Informe ao menos um intervalo de timestamps.');
  }

  if (lines.length > maxSegments) {
    throw new Error(`Limite de ${maxSegments} intervalos por exportacao.`);
  }

  const parsed = lines.map((line, index) => {
    const [start, end] = line.split('-').map((part) => part.trim());
    if (!start || !end) {
      throw new Error(`Formato invalido na linha ${index + 1}. Use mm:ss-mm:ss.`);
    }

    const startSeconds = timestampToSeconds(start);
    const endSeconds = timestampToSeconds(end);
    if (endSeconds <= startSeconds) {
      throw new Error(`Fim deve ser maior que inicio na linha ${index + 1}.`);
    }

    return { startSeconds, endSeconds };
  });

  parsed.sort((a, b) => a.startSeconds - b.startSeconds);

  for (let index = 1; index < parsed.length; index += 1) {
    const current = parsed[index];
    const previous = parsed[index - 1];
    if (current.startSeconds < previous.endSeconds) {
      throw new Error(
        `Intervalos sobrepostos: ${formatSeconds(previous.startSeconds)}-${formatSeconds(previous.endSeconds)} e ${formatSeconds(current.startSeconds)}-${formatSeconds(current.endSeconds)}.`,
      );
    }
  }

  return parsed;
};

export const totalDuration = (segments: ClipSegment[]): number => {
  return segments.reduce((sum, segment) => sum + (segment.endSeconds - segment.startSeconds), 0);
};

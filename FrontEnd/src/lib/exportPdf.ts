import { jsPDF } from 'jspdf';
import { toast } from 'sonner';

/* ─── Shared helpers ─── */

const COLORS = {
  bg: [255, 255, 255] as [number, number, number],
  card: [248, 250, 252] as [number, number, number],
  border: [224, 227, 231] as [number, number, number],
  primary: [36, 99, 235] as [number, number, number],
  text: [8, 8, 8] as [number, number, number],
  muted: [107, 114, 128] as [number, number, number],
  white: [255, 255, 255] as [number, number, number],
};

const addHeader = (doc: jsPDF, title: string, subtitle?: string) => {
  const w = doc.internal.pageSize.getWidth();
  // Background
  doc.setFillColor(...COLORS.bg);
  doc.rect(0, 0, w, doc.internal.pageSize.getHeight(), 'F');

  // Gradient bar
  doc.setFillColor(...COLORS.primary);
  doc.rect(0, 0, w, 3, 'F');

  // Title
  doc.setTextColor(...COLORS.text);
  doc.setFontSize(18);
  doc.setFont('helvetica', 'bold');
  doc.text(title, 14, 18);

  // Subtitle
  if (subtitle) {
    doc.setFontSize(10);
    doc.setFont('helvetica', 'normal');
    doc.setTextColor(...COLORS.muted);
    doc.text(subtitle, 14, 25);
  }

  // PlayTrack branding
  doc.setFontSize(9);
  doc.setTextColor(...COLORS.primary);
  doc.text('PlayTrack', w - 14, 18, { align: 'right' });

  return subtitle ? 32 : 26;
};

const addFooter = (doc: jsPDF) => {
  const w = doc.internal.pageSize.getWidth();
  const h = doc.internal.pageSize.getHeight();
  doc.setFontSize(7);
  doc.setTextColor(...COLORS.muted);
  doc.text(`Gerado por PlayTrack em ${new Date().toLocaleDateString('pt-BR')}`, 14, h - 8);
  doc.text(`Página ${doc.getCurrentPageInfo().pageNumber}`, w - 14, h - 8, { align: 'right' });
};

const formatPctPdf = (val: number) => {
  if (!val || isNaN(val)) return '0.0%';
  return (val * 100).toFixed(1) + '%';
};

/* ─── Box Score PDF ─── */

interface StatsData {
  aggregates: Record<string, number>;
  computed: Record<string, number>;
}

export const exportBoxScorePDF = (
  title: string,
  stats: StatsData,
  athletes?: { name: string; stats: StatsData }[],
  mainRowLabel: string = 'TIME'
) => {
  const toastId = toast.loading('Gerando PDF...');
  try {
    const doc = new jsPDF({ orientation: 'landscape', unit: 'mm', format: 'a4' });
    let y = addHeader(doc, `Box Score — ${title}`, `Relatório de estatísticas`);

    const w = doc.internal.pageSize.getWidth();
    const cols = ['', 'PTS', 'FGM', 'FGA', 'FG%', '2PM', '2PA', '2P%', '3PM', '3PA', '3P%', 'FTM', 'FTA', 'FT%', 'REB', 'ASS', 'RB', 'ERR', 'EFF'];
    const colW = (w - 28) / cols.length;

    // Table header
    doc.setFillColor(...COLORS.card);
    doc.rect(14, y, w - 28, 8, 'F');
    doc.setFontSize(7);
    doc.setFont('helvetica', 'bold');
    doc.setTextColor(...COLORS.primary);
    cols.forEach((col, i) => {
      doc.text(col, 14 + i * colW + (i === 0 ? 2 : colW / 2), y + 5.5, { align: i === 0 ? 'left' : 'center' });
    });
    y += 10;

    const drawRow = (label: string, s: StatsData, bold = false) => {
      if (y > doc.internal.pageSize.getHeight() - 20) {
        addFooter(doc);
        doc.addPage();
        doc.setFillColor(...COLORS.bg);
        doc.rect(0, 0, w, doc.internal.pageSize.getHeight(), 'F');
        y = 15;
      }

      const a = s.aggregates;
      const c = s.computed;
      const eff = (a.pts + a.reb + a.ass + a.rb) - ((a.fga - a.fgm) + (a.fta - a.ftm) + a.err);
      const values = [
        label,
        String(a.pts || 0),
        String(a.fgm || 0), String(a.fga || 0), formatPctPdf(c.fg_pct),
        String(a['2ptm'] || 0), String(a['2pta'] || 0), formatPctPdf(c.two_pt_pct),
        String(a['3ptm'] || 0), String(a['3pta'] || 0), formatPctPdf(c.three_pt_pct),
        String(a.ftm || 0), String(a.fta || 0), formatPctPdf(c.ft_pct),
        String(a.reb || 0), String(a.ass || 0), String(a.rb || 0), String(a.err || 0),
        String(Number(eff.toFixed(1))),
      ];

      // Row background
      doc.setFillColor(...(bold ? COLORS.primary : COLORS.bg));
      doc.rect(14, y - 1, w - 28, 7, 'F');

      // Border
      doc.setDrawColor(...COLORS.border);
      doc.line(14, y + 6, w - 14, y + 6);

      doc.setFontSize(7);
      doc.setFont('helvetica', bold ? 'bold' : 'normal');
      doc.setTextColor(...(bold ? COLORS.white : COLORS.text));

      values.forEach((val, i) => {
        const truncated = i === 0 && val.length > 18 ? val.slice(0, 18) + '…' : val;
        doc.text(truncated, 14 + i * colW + (i === 0 ? 2 : colW / 2), y + 4, { align: i === 0 ? 'left' : 'center' });
      });
      y += 8;
    };

    // Main totals row
    drawRow(mainRowLabel, stats, true);

    // Individual athlete rows
    if (athletes && athletes.length > 0) {
      y += 2;
      athletes.forEach((athlete) => {
        drawRow(athlete.name, athlete.stats);
      });
    }

    addFooter(doc);
    doc.save(`PlayTrack_BoxScore_${title.replace(/\s+/g, '_')}.pdf`);
    toast.success('Box Score exportado!', { id: toastId });
  } catch (err) {
    console.error('Erro ao gerar PDF:', err);
    toast.error('Erro ao gerar o PDF', { id: toastId });
  }
};

/* ─── Tactical Annotations PDF ─── */

interface TacticalEvent {
  videoTimestampSeconds: number;
  note?: string;
  athleteName?: string;
}

const fmtTime = (s: number) => {
  const m = Math.floor(s / 60);
  const sec = Math.floor(s % 60);
  return `${m.toString().padStart(2, '0')}:${sec.toString().padStart(2, '0')}`;
};

export const exportTacticalPDF = (title: string, annotations: TacticalEvent[]) => {
  const toastId = toast.loading('Gerando PDF...');
  try {
    const doc = new jsPDF({ orientation: 'portrait', unit: 'mm', format: 'a4' });
    const w = doc.internal.pageSize.getWidth();
    let y = addHeader(doc, `Anotações Táticas`, title);

    if (annotations.length === 0) {
      doc.setFontSize(11);
      doc.setTextColor(...COLORS.muted);
      doc.text('Sem anotações táticas registradas.', w / 2, y + 20, { align: 'center' });
      addFooter(doc);
      doc.save(`PlayTrack_Taticas_${title.replace(/\s+/g, '_')}.pdf`);
      toast.success('PDF de táticas exportado!', { id: toastId });
      return;
    }

    const sorted = [...annotations].sort((a, b) => a.videoTimestampSeconds - b.videoTimestampSeconds);

    sorted.forEach((ev) => {
      if (y > doc.internal.pageSize.getHeight() - 25) {
        addFooter(doc);
        doc.addPage();
        doc.setFillColor(...COLORS.bg);
        doc.rect(0, 0, w, doc.internal.pageSize.getHeight(), 'F');
        y = 15;
      }

      // Time badge
      doc.setFillColor(...COLORS.primary);
      doc.roundedRect(14, y, 18, 6, 1, 1, 'F');
      doc.setFontSize(7);
      doc.setFont('helvetica', 'bold');
      doc.setTextColor(...COLORS.primary);
      doc.text(fmtTime(ev.videoTimestampSeconds), 23, y + 4.2, { align: 'center' });

      // Athlete name (if present)
      let textX = 36;
      if (ev.athleteName) {
        doc.setFillColor(COLORS.primary[0], COLORS.primary[1], COLORS.primary[2]);
        doc.setTextColor(...COLORS.white);
        doc.setFontSize(6);
        const nameW = doc.getTextWidth(ev.athleteName) + 4;
        doc.roundedRect(textX, y, nameW, 6, 1, 1, 'F');
        doc.text(ev.athleteName, textX + 2, y + 4.2);
        textX += nameW + 3;
      }

      // Note text
      doc.setFontSize(9);
      doc.setFont('helvetica', 'normal');
      doc.setTextColor(...COLORS.text);
      const noteLines = doc.splitTextToSize(ev.note || '', w - textX - 14);
      doc.text(noteLines, textX, y + 4.5);
      y += Math.max(8, noteLines.length * 4.5 + 3);

      // Divider
      doc.setDrawColor(...COLORS.border);
      doc.line(14, y, w - 14, y);
      y += 3;
    });

    addFooter(doc);
    doc.save(`PlayTrack_Taticas_${title.replace(/\s+/g, '_')}.pdf`);
    toast.success('PDF de táticas exportado!', { id: toastId });
  } catch (err) {
    console.error('Erro ao gerar PDF:', err);
    toast.error('Erro ao gerar o PDF', { id: toastId });
  }
};

/* ─── Career Stats PDF ─── */

export const exportCareerStatsPDF = (
  teamStats: StatsData,
  athleteStats?: { athleteName: string; gamesPlayed: number; aggregates: Record<string, number>; computed: Record<string, number> }[],
  videosAnalyzed?: number
) => {
  const athletes = athleteStats?.map((a) => ({
    name: `${a.athleteName} (${a.gamesPlayed}J)`,
    stats: { aggregates: a.aggregates, computed: a.computed },
  }));
  exportBoxScorePDF(
    `Carreira${videosAnalyzed ? ` — ${videosAnalyzed} jogos` : ''}`,
    teamStats,
    athletes
  );
};

/* ─── Evolution Chart PDF (screenshot-based since it's a chart) ─── */

export const exportEvolutionPDF = async (elementId: string) => {
  const element = document.getElementById(elementId);
  if (!element) {
    toast.error('Elemento não encontrado');
    return;
  }
  const toastId = toast.loading('Gerando PDF...');
  try {
    const { default: html2canvas } = await import('html2canvas-pro');
    const canvas = await html2canvas(element, {
      scale: 2,
      useCORS: true,
      backgroundColor: '#ffffff',
      logging: false,
    });
    const imgData = canvas.toDataURL('image/png');
    const doc = new jsPDF({ orientation: 'landscape', unit: 'mm', format: 'a4' });
    const w = doc.internal.pageSize.getWidth();
    const h = doc.internal.pageSize.getHeight();

    doc.setFillColor(...COLORS.bg);
    doc.rect(0, 0, w, h, 'F');

    const imgW = w - 20;
    const imgH = (canvas.height * imgW) / canvas.width;
    doc.addImage(imgData, 'PNG', 10, 10, imgW, Math.min(imgH, h - 20));

    addFooter(doc);
    doc.save('PlayTrack_Evolucao.pdf');
    toast.success('PDF de evolução exportado!', { id: toastId });
  } catch (err) {
    console.error('Erro ao gerar PDF:', err);
    toast.error('Erro ao gerar o PDF', { id: toastId });
  }
};

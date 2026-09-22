export interface CertificateFontConfig {
  headerFont: string;
  titleFont: string;
  studentNameFont: string;
  bodyFont: string;
  footerFont: string;
}

export interface SignatoryConfig {
  enabled: boolean;
  useDigital: boolean;
  signatureUrl: string;
  title: string;
  sub: string;
}

export interface CertificateSignatoriesConfig {
  sig1: SignatoryConfig; // Prepared By / Registrar
  sig2: SignatoryConfig; // Class In-charge / Convener
  sig3: SignatoryConfig; // Head of Institution / Principal
}

export const CERTIFICATE_FONT_OPTIONS = [
  { id: "'Playfair Display', serif", name: 'Playfair Display (Classic Board Serif)' },
  { id: "'Cinzel', serif", name: 'Cinzel (Imperial Display)' },
  { id: "'EB Garamond', serif", name: 'EB Garamond (Royal Academic)' },
  { id: "'Plus Jakarta Sans', sans-serif", name: 'Plus Jakarta Sans (Crisp Modern)' },
  { id: "'Montserrat', sans-serif", name: 'Montserrat (Geometric Clean)' },
  { id: "'Great Vibes', cursive", name: 'Great Vibes (Calligraphic Script)' },
  { id: "'Alex Brush', cursive", name: 'Alex Brush (Elegant Flowing Script)' },
  { id: "'Courier New', monospace", name: 'Courier New (Security Monospace)' },
  { id: 'system-ui, sans-serif', name: 'System Sans-Serif' },
];

export const DEFAULT_CERTIFICATE_FONTS: CertificateFontConfig = {
  headerFont: "'Playfair Display', serif",
  titleFont: "'Cinzel', serif",
  studentNameFont: "'Playfair Display', serif",
  bodyFont: "'EB Garamond', serif",
  footerFont: "'EB Garamond', serif",
};

export const FONT_PRESETS: { name: string; description: string; fonts: CertificateFontConfig }[] = [
  {
    name: 'Imperial Board Standard',
    description: 'Cinzel titles with Garamond body and Playfair headers',
    fonts: {
      headerFont: "'Playfair Display', serif",
      titleFont: "'Cinzel', serif",
      studentNameFont: "'Playfair Display', serif",
      bodyFont: "'EB Garamond', serif",
      footerFont: "'EB Garamond', serif",
    },
  },
  {
    name: 'Royal Calligraphic Luxury',
    description: 'Calligraphic student name with regal serif typography',
    fonts: {
      headerFont: "'Cinzel', serif",
      titleFont: "'Cinzel', serif",
      studentNameFont: "'Great Vibes', cursive",
      bodyFont: "'EB Garamond', serif",
      footerFont: "'Playfair Display', serif",
    },
  },
  {
    name: 'Modern Prestigious',
    description: 'Contemporary high-contrast typography for modern schools',
    fonts: {
      headerFont: "'Montserrat', sans-serif",
      titleFont: "'Cinzel', serif",
      studentNameFont: "'Montserrat', sans-serif",
      bodyFont: "'Plus Jakarta Sans', sans-serif",
      footerFont: "'Plus Jakarta Sans', sans-serif",
    },
  },
  {
    name: 'Traditional British Grammar',
    description: 'Classical all-serif institutional format',
    fonts: {
      headerFont: "'Playfair Display', serif",
      titleFont: "'Playfair Display', serif",
      studentNameFont: "'Playfair Display', serif",
      bodyFont: "'EB Garamond', serif",
      footerFont: "'EB Garamond', serif",
    },
  },
];

export interface Corridor {
  id: string;
  family: string;
  color: string;
  category: 'IC' | 'ICD' | 'SPR';
  stations: string[];
}

export const LINE_FAMILIES: Record<string, { color: string; label: string }> = {
  'ic-south':     { color: '#E8432E', label: 'IC South' },
  'ic-east':      { color: '#0A5CE8', label: 'IC East' },
  'ic-north':     { color: '#2EAF5B', label: 'IC North' },
  'ic-brabant':   { color: '#F5A623', label: 'IC Brabant' },
  'ic-limburg':   { color: '#8B5CF6', label: 'IC Limburg' },
  'ic-coast':     { color: '#06B6D4', label: 'IC Coast' },
  'ic-oost':      { color: '#EC4899', label: 'IC Oost' },
  'ic-zeeland':   { color: '#78716C', label: 'IC Zeeland' },
  'ic-friesland': { color: '#D97706', label: 'IC Friesland' },
  'ic-direct':    { color: '#FACC15', label: 'IC Direct' },
};

export const CORRIDORS: Corridor[] = [
  // ─── IC Direct ───
  {
    id: 'icd-amsterdam-breda',
    family: 'ic-direct',
    color: '#FACC15',
    category: 'ICD',
    stations: ['ASD', 'ASS', 'SHL', 'RTD', 'BD'],
  },
  {
    id: 'icd-amsterdam-breda-via-hvs',
    family: 'ic-direct',
    color: '#FACC15',
    category: 'ICD',
    stations: ['AMFS', 'AMF', 'HVS', 'DVD', 'ASDZ', 'SHL', 'RTD', 'BD'],
  },

  // ─── IC South: Amsterdam ↔ Rotterdam / Den Haag via Haarlem/Leiden ───
  {
    id: 'ic-amsterdam-denhaag',
    family: 'ic-south',
    color: '#E8432E',
    category: 'IC',
    stations: ['ASD', 'ASS', 'HLM', 'HAD', 'LEDN', 'LAA', 'GV', 'DT', 'SDM', 'RTD'],
  },
  {
    id: 'ic-denhaag-direct',
    family: 'ic-south',
    color: '#E8432E',
    category: 'IC',
    stations: ['ASD', 'ASS', 'HLM', 'HAD', 'LEDN', 'GVC'],
  },
  {
    id: 'ic-rotterdam-dordrecht',
    family: 'ic-south',
    color: '#E8432E',
    category: 'IC',
    stations: ['RTD', 'RTB', 'DDR'],
  },

  // ─── IC East: Amsterdam ↔ Amersfoort ↔ Deventer ↔ Enschede ───
  {
    id: 'ic-amsterdam-enschede',
    family: 'ic-east',
    color: '#0A5CE8',
    category: 'IC',
    stations: ['GVC', 'GD', 'UT', 'AMF', 'APD', 'DV', 'AML', 'HGL', 'ES'],
  },
  {
    id: 'ic-amsterdam-utrecht-amstel',
    family: 'ic-east',
    color: '#0A5CE8',
    category: 'IC',
    stations: ['ASD', 'ASA', 'UT'],
  },
  {
    id: 'ic-amsterdam-utrecht-via-hvs',
    family: 'ic-east',
    color: '#0A5CE8',
    category: 'IC',
    stations: ['ASD', 'ASDM', 'HVS', 'AMF'],
  },
  {
    id: 'ic-denhelder-nijmegen',
    family: 'ic-east',
    color: '#0A5CE8',
    category: 'IC',
    stations: ['HDR', 'HDRZ', 'ANA', 'SGN', 'HWD', 'AMRN', 'AMR', 'HLO', 'CAS', 'ZD', 'ASS', 'ASD', 'ASA', 'UT', 'DB', 'ED', 'AH', 'NM'],
  },

  // ─── IC North: Amsterdam ↔ Zwolle ↔ Groningen / Leeuwarden ───
  {
    id: 'ic-amsterdam-groningen',
    family: 'ic-north',
    color: '#2EAF5B',
    category: 'IC',
    stations: ['GVC', 'GD', 'UT', 'AMF', 'ZL', 'ASN', 'GN'],
  },
  {
    id: 'ic-amsterdam-leeuwarden',
    family: 'ic-north',
    color: '#2EAF5B',
    category: 'IC',
    stations: ['SHL', 'ASS', 'ASD', 'ASDM', 'HVS', 'AMF', 'ZL', 'MP', 'SWK', 'HR', 'LW'],
  },
  {
    id: 'ic-utrecht-denhaag-via-gouda',
    family: 'ic-north',
    color: '#2EAF5B',
    category: 'IC',
    stations: ['UT', 'GD', 'GVC'],
  },

  // ─── IC Brabant: Utrecht ↔ Eindhoven + cross-country ───
  {
    id: 'ic-utrecht-eindhoven',
    family: 'ic-brabant',
    color: '#F5A623',
    category: 'IC',
    stations: ['UT', 'GD', 'RTA', 'RTD', 'BD', 'TB', 'EHV'],
  },
  {
    id: 'ic-zwolle-roosendaal',
    family: 'ic-brabant',
    color: '#F5A623',
    category: 'IC',
    stations: ['ZL', 'WH', 'OST', 'DV', 'ZP', 'DR', 'AH', 'NM', 'O', 'HTO', 'HT', 'TB', 'BD', 'ETN', 'RSD'],
  },
  {
    id: 'ic-eindhoven-venlo',
    family: 'ic-brabant',
    color: '#F5A623',
    category: 'IC',
    stations: ['HT', 'BTL', 'EHV', 'HM', 'DN', 'HRT', 'BR', 'VL'],
  },

  // ─── IC Limburg: Eindhoven ↔ Maastricht / Heerlen ───
  {
    id: 'ic-eindhoven-maastricht',
    family: 'ic-limburg',
    color: '#8B5CF6',
    category: 'IC',
    stations: ['HT', 'BTL', 'EHV', 'WT', 'RM', 'STD', 'MT'],
  },
  {
    id: 'ic-eindhoven-heerlen',
    family: 'ic-limburg',
    color: '#8B5CF6',
    category: 'IC',
    stations: ['GVC', 'GV', 'DT', 'RTD', 'DDR', 'BD', 'TB', 'EHV', 'WT', 'RM', 'STD', 'HRL'],
  },

  // ─── IC Coast: Leiden ↔ Haarlem ↔ Den Haag ───
  {
    id: 'ic-alkmaar-amsterdam',
    family: 'ic-coast',
    color: '#06B6D4',
    category: 'IC',
    stations: ['AMR', 'CAS', 'ZD', 'ASS', 'ASD', 'ASA', 'UT'],
  },
  {
    id: 'ic-hoorn-enkhuizen',
    family: 'ic-coast',
    color: '#06B6D4',
    category: 'IC',
    stations: ['ASD', 'ASS', 'HN', 'HNK', 'HKS', 'BKG', 'BKF', 'EKZ'],
  },

  // ─── IC Oost: Zwolle ↔ Enschede, IJssellijn ───
  {
    id: 'ic-schiphol-lelystad',
    family: 'ic-oost',
    color: '#EC4899',
    category: 'IC',
    stations: ['SHL', 'ASS', 'ASD', 'ASDM', 'HVS', 'AMF'],
  },

  // ─── IC Zeeland: Roosendaal ↔ Vlissingen ───
  {
    id: 'ic-roosendaal-vlissingen',
    family: 'ic-zeeland',
    color: '#78716C',
    category: 'IC',
    stations: ['ASD', 'ASS', 'HLM', 'HAD', 'LEDN', 'LAA', 'GV', 'DT', 'SDM', 'RTD', 'RTB', 'DDR', 'RSD', 'BGN', 'RB', 'KBD', 'KRG', 'BZL', 'GS', 'ARN', 'MDB', 'VSS', 'VS'],
  },

  // ─── IC Friesland: northern branches ───
  {
    id: 'ic-schiphol-almere-lelystad',
    family: 'ic-friesland',
    color: '#D97706',
    category: 'IC',
    stations: ['SHL', 'ASDZ', 'DVD', 'WP', 'ALM', 'LLS'],
  },

  // ─── SPR South: Rotterdam ↔ Den Haag ↔ Dordrecht (all stops) ───
  {
    id: 'spr-dordrecht-denhaag',
    family: 'ic-south',
    color: '#E8432E',
    category: 'SPR',
    stations: ['DDR', 'ZWD', 'BRD', 'RLB', 'RTZ', 'RTB', 'RTD', 'SDM', 'DTCP', 'DT', 'RSW', 'GVMW', 'GV', 'GVC'],
  },
  {
    id: 'spr-haarlem-zandvoort',
    family: 'ic-south',
    color: '#E8432E',
    category: 'SPR',
    stations: ['ASD', 'ASS', 'HWZB', 'HLMS', 'HLM', 'OVN', 'ZVT'],
  },

  // ─── SPR Coast: Haarlem ↔ Leiden ↔ Den Haag (all stops) ───
  {
    id: 'spr-haarlem-denhaag',
    family: 'ic-coast',
    color: '#06B6D4',
    category: 'SPR',
    stations: ['HLM', 'HAD', 'HIL', 'SSH', 'VH', 'LEDN', 'DVNK', 'VST', 'GVM', 'LAA', 'GVC'],
  },
  {
    id: 'spr-hoorn-amsterdam-kustlijn',
    family: 'ic-coast',
    color: '#06B6D4',
    category: 'SPR',
    stations: ['HN', 'OBD', 'HWD', 'AMRN', 'AMR', 'HLO', 'CAS', 'UTG', 'HK', 'BV', 'DRH', 'SPTN', 'SPTZ', 'BLL', 'HLM', 'HLMS', 'HWZB', 'ASS', 'ASD'],
  },
  {
    id: 'spr-hoorn-amsterdam-purmerend',
    family: 'ic-coast',
    color: '#06B6D4',
    category: 'SPR',
    stations: ['HN', 'HNK', 'PMO', 'PMR', 'PMW', 'ZDK', 'ZD', 'ASS', 'ASDL', 'SHL', 'HFD'],
  },

  // ─── SPR East: Uitgeest ↔ Amsterdam ↔ Utrecht (all stops) ───
  {
    id: 'spr-uitgeest-utrecht',
    family: 'ic-east',
    color: '#0A5CE8',
    category: 'SPR',
    stations: ['UTG', 'KMA', 'WM', 'ZZS', 'KZ', 'ZD', 'ASS', 'ASD', 'ASDM', 'ASA', 'DVD', 'ASB', 'ASHD', 'AC', 'BKL', 'MAS', 'UTZL', 'UT'],
  },
  {
    id: 'spr-uitgeest-amsterdam-gouda-rtd',
    family: 'ic-east',
    color: '#0A5CE8',
    category: 'SPR',
    stations: ['UTG', 'KMA', 'WM', 'ZZS', 'KZ', 'ZD', 'ASS', 'ASD', 'ASDM', 'ASA', 'DVD', 'ASB', 'ASHD', 'AC', 'BKL', 'WD', 'GDG', 'GD', 'NWK', 'CPS', 'RTA', 'RTN', 'RTD'],
  },
  {
    id: 'spr-amsterdam-amersfoort',
    family: 'ic-east',
    color: '#0A5CE8',
    category: 'SPR',
    stations: ['ASD', 'ASDM', 'ASSP', 'DMN', 'WP', 'NDB', 'BSMZ', 'HVSM', 'HVS', 'BRN', 'AMF', 'AMFS', 'AVAT'],
  },
  {
    id: 'spr-amsterdam-hoofddorp',
    family: 'ic-east',
    color: '#0A5CE8',
    category: 'SPR',
    stations: ['ASD', 'ASS', 'ASDL', 'SHL', 'HFD'],
  },
  {
    id: 'spr-utrecht-hilversum-asd-via-rai',
    family: 'ic-east',
    color: '#0A5CE8',
    category: 'SPR',
    stations: ['UT', 'UTO', 'HOR', 'HVSP', 'HVS', 'NDB', 'WP', 'DMNZ', 'DVD', 'RAI', 'ASDZ', 'SHL', 'NVP', 'HFD'],
  },

  // ─── SPR North: Utrecht ↔ Zwolle (all stops) ───
  {
    id: 'spr-utrecht-zwolle',
    family: 'ic-north',
    color: '#2EAF5B',
    category: 'SPR',
    stations: ['UT', 'UTO', 'BHV', 'DLD', 'AMF', 'AMFS', 'AVAT', 'NKK', 'PT', 'EML', 'HD', 'NS', 'HDE', 'WZ', 'ZL'],
  },
  {
    id: 'spr-zwolle-groningen',
    family: 'ic-north',
    color: '#2EAF5B',
    category: 'SPR',
    stations: ['ZL', 'MP', 'HGV', 'BL', 'ASN', 'HRN', 'GERP', 'GN'],
  },
  {
    id: 'spr-zwolle-leeuwarden-almere',
    family: 'ic-north',
    color: '#2EAF5B',
    category: 'SPR',
    stations: ['ALM', 'ALMP', 'ALMB', 'ALMO', 'LLS', 'DRON', 'KPNZ', 'ZL', 'MP', 'SWK', 'WV', 'HR', 'AKM', 'GW', 'LW'],
  },
  {
    id: 'spr-almere-local',
    family: 'ic-north',
    color: '#2EAF5B',
    category: 'SPR',
    stations: ['ALMM', 'ALM', 'AMPO'],
  },
  {
    id: 'spr-utrecht-denhaag-via-gouda',
    family: 'ic-north',
    color: '#2EAF5B',
    category: 'SPR',
    stations: ['UT', 'UTLR', 'UTT', 'VTN', 'WD', 'GDG', 'GD', 'LLZM', 'ZTMO', 'ZTM', 'YPB', 'VB', 'GVC'],
  },
  {
    id: 'spr-utrecht-woerden',
    family: 'ic-north',
    color: '#2EAF5B',
    category: 'SPR',
    stations: ['UT', 'UTLR', 'UTT', 'VTN', 'WD'],
  },
  {
    id: 'spr-utrecht-driebergen',
    family: 'ic-north',
    color: '#2EAF5B',
    category: 'SPR',
    stations: ['UT', 'UTVR', 'BNK', 'DB'],
  },
  {
    id: 'spr-utrecht-geldermalsen',
    family: 'ic-north',
    color: '#2EAF5B',
    category: 'SPR',
    stations: ['UT', 'UTVR', 'UTLN', 'HTN', 'HTNC', 'CL', 'GDM'],
  },
  {
    id: 'spr-utrecht-rhenen',
    family: 'ic-north',
    color: '#2EAF5B',
    category: 'SPR',
    stations: ['UT', 'UTM', 'DB', 'MRN', 'VNDC', 'VNDW', 'RHN'],
  },
  {
    id: 'spr-leiden-alphen-utrecht',
    family: 'ic-north',
    color: '#2EAF5B',
    category: 'SPR',
    stations: ['LEDN', 'LDL', 'APN', 'BDG', 'WD', 'UT'],
  },

  // ─── SPR Brabant: Den Bosch ↔ Eindhoven ↔ Tilburg (all stops) ───
  {
    id: 'spr-denbosch-eindhoven-deurne',
    family: 'ic-brabant',
    color: '#F5A623',
    category: 'SPR',
    stations: ['HT', 'VG', 'BTL', 'BET', 'EHS', 'EHV', 'HMBV', 'HMH', 'HM', 'HMBH', 'DN'],
  },
  {
    id: 'spr-tilburg-eindhoven-weert',
    family: 'ic-brabant',
    color: '#F5A623',
    category: 'SPR',
    stations: ['TBU', 'TB', 'OT', 'BTL', 'BET', 'EHS', 'EHV', 'GP', 'HZE', 'MZ', 'WT'],
  },
  {
    id: 'spr-dordrecht-breda-arnhem',
    family: 'ic-brabant',
    color: '#F5A623',
    category: 'SPR',
    stations: ['DDR', 'DDZD', 'ZLW', 'BDPB', 'BD', 'GZ', 'TBR', 'TBU', 'TB', 'HT', 'HTO', 'RS', 'OW', 'O', 'RVS', 'WC', 'NMD', 'NMGO', 'NM', 'NML', 'EST', 'AHZ', 'AH'],
  },
  {
    id: 'spr-gouda-alphen',
    family: 'ic-brabant',
    color: '#F5A623',
    category: 'SPR',
    stations: ['GD', 'WADT', 'WAD', 'WADN', 'BSKS', 'BSK', 'APN'],
  },
  {
    id: 'spr-roosendaal-dordrecht',
    family: 'ic-brabant',
    color: '#F5A623',
    category: 'SPR',
    stations: ['RSD', 'ODB', 'ZVB', 'ZLW', 'DDZD', 'DDR'],
  },

  // ─── SPR Oost: Zwolle ↔ Enschede, Deventer lines ───
  {
    id: 'spr-zwolle-enschede',
    family: 'ic-oost',
    color: '#EC4899',
    category: 'SPR',
    stations: ['ZL', 'HNO', 'RAT', 'NVD', 'WDN', 'AML', 'AMRI', 'BN', 'HGL', 'ESK', 'ES'],
  },
  {
    id: 'spr-apeldoorn-almelo',
    family: 'ic-oost',
    color: '#EC4899',
    category: 'SPR',
    stations: ['APD', 'APDO', 'TWL', 'DV', 'DVC', 'HON', 'RSN', 'WDN', 'AML'],
  },
  {
    id: 'spr-zwolle-kampen',
    family: 'ic-oost',
    color: '#EC4899',
    category: 'SPR',
    stations: ['ZL', 'ZLSH', 'KPN'],
  },
  {
    id: 'spr-zwolle-emmen',
    family: 'ic-oost',
    color: '#EC4899',
    category: 'SPR',
    stations: ['ZL', 'DL', 'OMN', 'MRB', 'GBG', 'HDB', 'CO', 'NA', 'EMNZ', 'EMN'],
  },
  {
    id: 'spr-almelo-hardenberg',
    family: 'ic-oost',
    color: '#EC4899',
    category: 'SPR',
    stations: ['AML', 'VZ', 'DA', 'VHP', 'MRB', 'HDB'],
  },
  {
    id: 'spr-arnhem-ede',
    family: 'ic-oost',
    color: '#EC4899',
    category: 'SPR',
    stations: ['AH', 'OTB', 'WF', 'ED'],
  },
  {
    id: 'spr-ede-amersfoort',
    family: 'ic-oost',
    color: '#EC4899',
    category: 'SPR',
    stations: ['ED', 'EDC', 'LTN', 'BNZ', 'BNC', 'BNN', 'HVL', 'AMF'],
  },
  {
    id: 'spr-arnhem-nijmegen-zutphen',
    family: 'ic-oost',
    color: '#EC4899',
    category: 'SPR',
    stations: ['NM', 'NML', 'EST', 'AHZ', 'AH', 'AHP', 'AHPR', 'VP', 'RH', 'DR', 'BMN', 'ZP'],
  },
  {
    id: 'spr-arnhem-tiel',
    family: 'ic-oost',
    color: '#EC4899',
    category: 'SPR',
    stations: ['AH', 'EST', 'ZA', 'HMN', 'OP', 'KTR', 'TL', 'TPSW'],
  },
  {
    id: 'spr-arnhem-doetinchem-winterswijk',
    family: 'ic-oost',
    color: '#EC4899',
    category: 'SPR',
    stations: ['AH', 'AHP', 'WTV', 'DVN', 'ZV', 'DID', 'WL', 'DTCH', 'DTC', 'GDR', 'TBG', 'VSV', 'ATN', 'WW'],
  },
  {
    id: 'spr-winterswijk-zutphen',
    family: 'ic-oost',
    color: '#EC4899',
    category: 'SPR',
    stations: ['WW', 'WWW', 'LTV', 'RL', 'VD', 'ZP'],
  },
  {
    id: 'spr-zutphen-hengelo-oldenzaal',
    family: 'ic-oost',
    color: '#EC4899',
    category: 'SPR',
    stations: ['ZP', 'LC', 'GO', 'DDN', 'HGLG', 'HGL', 'HGLO', 'ODZ'],
  },
  {
    id: 'spr-zutphen-apeldoorn',
    family: 'ic-oost',
    color: '#EC4899',
    category: 'SPR',
    stations: ['ZP', 'VEM', 'KBK', 'APDM', 'APD'],
  },
  {
    id: 'spr-enschede-local',
    family: 'ic-oost',
    color: '#EC4899',
    category: 'SPR',
    stations: ['ES', 'ESE', 'GBR'],
  },
  {
    id: 'spr-veenendaal-de-klomp',
    family: 'ic-oost',
    color: '#EC4899',
    category: 'SPR',
    stations: ['ED', 'KLP', 'VNDC'],
  },
  {
    id: 'spr-geldermalsen-dordrecht',
    family: 'ic-oost',
    color: '#EC4899',
    category: 'SPR',
    stations: ['GDM', 'BSD', 'LDM', 'AKL', 'GR', 'BHDV', 'GND', 'HBZM', 'SDT', 'SDTB', 'DDRS', 'DDR'],
  },
  {
    id: 'spr-geldermalsen-tiel',
    family: 'ic-oost',
    color: '#EC4899',
    category: 'SPR',
    stations: ['GDM', 'ZBM', 'TL'],
  },
  {
    id: 'spr-nijmegen-boxmeer',
    family: 'ic-oost',
    color: '#EC4899',
    category: 'SPR',
    stations: ['NM', 'NMH', 'MMLH', 'CK', 'BMR'],
  },

  // ─── SPR Zeeland: Roosendaal ↔ Vlissingen (already covered by IC) ───

  // ─── SPR Limburg: local lines ───
  {
    id: 'spr-roermond-maastricht',
    family: 'ic-limburg',
    color: '#8B5CF6',
    category: 'SPR',
    stations: ['RM', 'EC', 'SRN', 'STD', 'LUT', 'BK', 'BDE', 'MT', 'MTR'],
  },
  {
    id: 'spr-maastricht-valkenburg',
    family: 'ic-limburg',
    color: '#8B5CF6',
    category: 'SPR',
    stations: ['MTR', 'MT', 'MTN', 'MES', 'SGL', 'VK'],
  },
  {
    id: 'spr-valkenburg-heerlen',
    family: 'ic-limburg',
    color: '#8B5CF6',
    category: 'SPR',
    stations: ['VK', 'VDL', 'HRLW', 'HRL'],
  },
  {
    id: 'spr-heerlen-kerkrade',
    family: 'ic-limburg',
    color: '#8B5CF6',
    category: 'SPR',
    stations: ['HRL', 'LG', 'EGH', 'CVM', 'KRD'],
  },
  {
    id: 'spr-heerlen-sittard',
    family: 'ic-limburg',
    color: '#8B5CF6',
    category: 'SPR',
    stations: ['HRL', 'HB', 'NH', 'SN', 'SBK', 'GLN', 'STD'],
  },
  {
    id: 'spr-roermond-venlo-boxmeer',
    family: 'ic-limburg',
    color: '#8B5CF6',
    category: 'SPR',
    stations: ['BMR', 'VLB', 'VRY', 'BR', 'VL', 'TG', 'RV', 'SM', 'RM'],
  },
  {
    id: 'spr-maastricht-eijsden',
    family: 'ic-limburg',
    color: '#8B5CF6',
    category: 'SPR',
    stations: ['MT', 'EDN'],
  },
  {
    id: 'spr-eygelshoven-markt',
    family: 'ic-limburg',
    color: '#8B5CF6',
    category: 'SPR',
    stations: ['EGH', 'EGHM'],
  },
  {
    id: 'spr-maastricht-heerlen-direct',
    family: 'ic-limburg',
    color: '#8B5CF6',
    category: 'SPR',
    stations: ['MT', 'HRL'],
  },
  {
    id: 'spr-klimmen-ransdaal',
    family: 'ic-limburg',
    color: '#8B5CF6',
    category: 'SPR',
    stations: ['VK', 'KMR', 'SOG', 'NH'],
  },

  // ─── SPR Friesland: local lines ───
  {
    id: 'spr-leeuwarden-stavoren',
    family: 'ic-friesland',
    color: '#D97706',
    category: 'SPR',
    stations: ['LW', 'MG', 'SKND', 'SK', 'IJT', 'WK', 'HNP', 'KMW', 'STV'],
  },
  {
    id: 'spr-leeuwarden-harlingen',
    family: 'ic-friesland',
    color: '#D97706',
    category: 'SPR',
    stations: ['LW', 'DEI', 'DRP', 'FN', 'HLG', 'HLGH'],
  },
  {
    id: 'spr-leeuwarden-groningen',
    family: 'ic-friesland',
    color: '#D97706',
    category: 'SPR',
    stations: ['LW', 'LWC', 'HDG', 'FWD', 'DWE', 'BP', 'GK', 'ZH', 'GN', 'GERP'],
  },
  {
    id: 'spr-leeuwarden-heerenveen',
    family: 'ic-friesland',
    color: '#D97706',
    category: 'SPR',
    stations: ['HRY', 'HR'],
  },
  {
    id: 'spr-groningen-delfzijl',
    family: 'ic-friesland',
    color: '#D97706',
    category: 'SPR',
    stations: ['GN', 'GNN', 'SWD', 'BDM', 'STM', 'LP', 'APG', 'DZW', 'DZ'],
  },
  {
    id: 'spr-groningen-eemshaven',
    family: 'ic-friesland',
    color: '#D97706',
    category: 'SPR',
    stations: ['GN', 'GNN', 'SWD', 'WSM', 'BF', 'WFM', 'UST', 'UHZ', 'UHM', 'RD', 'EEM'],
  },
  {
    id: 'spr-groningen-veendam',
    family: 'ic-friesland',
    color: '#D97706',
    category: 'SPR',
    stations: ['GN', 'GERP', 'KW', 'MTH', 'HGZ', 'ZB', 'VDM'],
  },
  {
    id: 'spr-groningen-winschoten-nieuweschans',
    family: 'ic-friesland',
    color: '#D97706',
    category: 'SPR',
    stations: ['GN', 'GERP', 'SDA', 'WS', 'NSCH'],
  },
  {
    id: 'spr-zuidbroek-hub',
    family: 'ic-friesland',
    color: '#D97706',
    category: 'SPR',
    stations: ['ZB', 'HGZ', 'MTH', 'KW', 'GERP'],
  },

  // ─── SPR Flevoland ───
  {
    id: 'spr-schiphol-almere-lelystad',
    family: 'ic-friesland',
    color: '#D97706',
    category: 'SPR',
    stations: ['SHL', 'ASDZ', 'DVD', 'WP', 'ALMM', 'ALM', 'AMPO', 'ALMP', 'ALMB', 'ALMO', 'LLS'],
  },

  // ─── BSN 930100 Utrecht → Den Bosch (bus-substitution, include for completeness) ───
  {
    id: 'spr-denbosch-oost',
    family: 'ic-brabant',
    color: '#F5A623',
    category: 'SPR',
    stations: ['HT', 'HTO'],
  },

  // ─── RTST (Rotterdam Stadion) - facultatief ───
  {
    id: 'spr-rotterdam-stadion',
    family: 'ic-south',
    color: '#E8432E',
    category: 'SPR',
    stations: ['RLB', 'RTST'],
  },

  // ─── SPR Leiden → Den Haag local ───
  {
    id: 'spr-leiden-denhaag-local',
    family: 'ic-coast',
    color: '#06B6D4',
    category: 'SPR',
    stations: ['LEDN', 'LDL', 'APN'],
  },
  {
    id: 'spr-alphen-gouda',
    family: 'ic-coast',
    color: '#06B6D4',
    category: 'SPR',
    stations: ['APN', 'BSK', 'BSKS', 'WADN', 'WAD', 'WADT', 'GD'],
  },

  // ─── SPR remaining Utrecht local ───
  {
    id: 'spr-utrecht-maliebaan',
    family: 'ic-north',
    color: '#2EAF5B',
    category: 'SPR',
    stations: ['UT', 'UTM'],
  },

  // ─── DLN (Dalen) on Emmen line ───
  {
    id: 'spr-coevorden-emmen',
    family: 'ic-oost',
    color: '#EC4899',
    category: 'SPR',
    stations: ['CO', 'DLN', 'NA'],
  },

  // ─── ST Soest local ───
  {
    id: 'spr-soest-local',
    family: 'ic-north',
    color: '#2EAF5B',
    category: 'SPR',
    stations: ['BRN', 'ST', 'STZ', 'SD', 'AMF'],
  },
];

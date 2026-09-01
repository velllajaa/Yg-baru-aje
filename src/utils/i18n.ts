import { Language } from '../types';

export interface Translations {
  // Brand & Header
  appSubtitle: string;
  cloudSync: string;
  shift: string;
  today: string;
  previousDay: string;
  nextDay: string;
  generateReport: string;
  backup: string;
  settings: string;
  switchLanguage: string;

  // Tabs
  tabDailySheet: string;
  tabInteractiveQuota: string;
  tabBattalionReports: string;
  tabAnalytics: string;
  tabStaffRoster: string;
  sheetsModeBadge: string;
  unloggedBadge: string;

  // Spreadsheet
  dailyLogSheetTitle: string;
  searchPersonnel: string;
  printPdf: string;
  dateCol: string;
  usernameCol: string;
  positionCol: string;
  tryoutCol: string;
  tryoutStatsCol: string;
  dmsCol: string;
  dmsStatsCol: string;
  bmtsCol: string;
  bmtsStatsCol: string;
  selectionsCol: string;
  selectionsStatsCol: string;
  ddtPhasesCol: string;
  ddtStatsCol: string;
  wiCol: string;
  wiStatsCol: string;
  inGameHourCol: string;
  overseerNotesCol: string;
  footerTitle: string;
  noPersonnel: string;

  // Settings Modal
  settingsTitle: string;
  settingsSubtitle: string;
  generalTab: string;
  quotasTab: string;
  customActivitiesTab: string;
  discordTab: string;
  dangerTab: string;
  
  appNameLabel: string;
  appSubtitleLabel: string;
  timezoneLabel: string;
  languageSelectLabel: string;
  shiftTimeLabel: string;
  shiftTimeHelp: string;
  discordHeaderEmojiLabel: string;
  discordHeaderEmojiHelp: string;
  defaultPingLabel: string;
  defaultPingHelp: string;

  quotaConfigTitle: string;
  quotaConfigHelp: string;
  firstBatQuotas: string;
  secondBatQuotas: string;
  cgQuotas: string;
  addNewTask: string;
  taskNameLabel: string;
  taskShortLabel: string;
  defaultTargetLabel: string;
  assignedBattalion: string;
  positionOverrides: string;
  deleteTaskConfirm: string;
  noCustomTasks: string;

  saveChanges: string;
  saving: string;
  savedSuccess: string;
  resetDefaults: string;

  // Discord Modal
  discordModalTitle: string;
  copyDiscord: string;
  copied: string;
  close: string;
}

export const TRANSLATIONS: Record<Language, Translations> = {
  id: {
    appSubtitle: 'Sistem Shift & Kuota Harian',
    cloudSync: 'Sinkronisasi Cloud Aktif',
    shift: 'Shift',
    today: 'Hari Ini',
    previousDay: 'Hari Sebelumnya',
    nextDay: 'Hari Berikutnya',
    generateReport: 'Buat Laporan Shift',
    backup: 'Backup & Restore',
    settings: 'Pengaturan Lengkap',
    switchLanguage: 'Ganti Bahasa / Switch Language',

    tabDailySheet: 'BRIGCOMM Daily Log Sheet',
    tabInteractiveQuota: 'Interactive Quota Tracker',
    tabBattalionReports: 'Battalion Reports',
    tabAnalytics: 'Analytics & Grafik',
    tabStaffRoster: 'Roster & Personil',
    sheetsModeBadge: 'Sheets Mode',
    unloggedBadge: 'belum dicatat',

    dailyLogSheetTitle: 'DAILY LOG SHEET',
    searchPersonnel: 'Cari personil / username...',
    printPdf: 'Cetak / PDF',
    dateCol: 'Date',
    usernameCol: 'Username',
    positionCol: 'Position',
    tryoutCol: 'Tryout',
    tryoutStatsCol: 'Tryout Stats',
    dmsCol: 'DMs Reminder',
    dmsStatsCol: 'DMs Reminder Stats',
    bmtsCol: 'BMTs / SV',
    bmtsStatsCol: 'BMTs / SVs Stats',
    selectionsCol: 'Selections Daily',
    selectionsStatsCol: 'Selections Stats',
    ddtPhasesCol: 'DDT Phases Daily',
    ddtStatsCol: 'DDT Stats',
    wiCol: 'WI Daily',
    wiStatsCol: 'WI Stats',
    inGameHourCol: 'In-game activity hour',
    overseerNotesCol: 'Overseer Notes',
    footerTitle: 'SPREADSHEET FOOTER',
    noPersonnel: 'Tidak ada personil yang ditugaskan di unit ini.',

    settingsTitle: 'Pengaturan Lengkap Website BRIGCOMM',
    settingsSubtitle: 'Kustomisasi penuh judul, jam shift, kuota target per unit, Discord tags, dan preferensi bahasa.',
    generalTab: 'Umum & Tampilan',
    quotasTab: 'Target Kuota (Met/Not Met)',
    discordTab: 'Format Discord & Ping',
    dangerTab: 'Reset Data',

    appNameLabel: 'Nama Aplikasi / Title',
    appSubtitleLabel: 'Sub-judul Aplikasi',
    timezoneLabel: 'Label Zona Waktu & Komando',
    languageSelectLabel: 'Bahasa Sistem (Language)',
    shiftTimeLabel: 'Waktu Selesai Shift Default (AEST)',
    shiftTimeHelp: 'Jam standar pelaporan shift harian militer (default 20:30).',
    discordHeaderEmojiLabel: 'Discord Header Prefix & Custom Emoji',
    discordHeaderEmojiHelp: 'Header teks atau emoji di baris pertama laporan Discord.',
    defaultPingLabel: 'Default Role & User Ping Discord',
    defaultPingHelp: 'Tag discord yang otomatis ditempelkan di bagian atas ringkasan.',

    quotaConfigTitle: 'Konfigurasi Standar Kuota Penilaian Otomatis',
    quotaConfigHelp: 'Atur angka batas minimal agar status otomatis bernilai "Met" atau "Not Met" di spreadsheet.',
    firstBatQuotas: '1B BRIGCOMM Quota (Tryouts & DMs)',
    secondBatQuotas: '2B BRIGCOMM Quota (Tryouts, BMTs/SV, DMs)',
    cgQuotas: 'Commandants Guards BRIGCOMM Quota (Selections, DDT, WI, DMs)',
    customActivitiesTab: 'Kustomisasi Tugas & Kuota',
    addNewTask: 'Tambah Tugas / Aktivitas Baru',
    taskNameLabel: 'Nama Tugas / Aktivitas',
    taskShortLabel: 'Label Kolom Singkat',
    defaultTargetLabel: 'Target Angka Standar',
    assignedBattalion: 'Unit Batalyon',
    positionOverrides: 'Target Spesifik Posisi (BXO, BSM, Officer)',
    deleteTaskConfirm: 'Apakah Anda yakin ingin menghapus tugas ini?',
    noCustomTasks: 'Belum ada tugas tambahan.',

    saveChanges: 'Simpan Semua Pengaturan',
    saving: 'Menyimpan...',
    savedSuccess: 'Pengaturan Berhasil Disimpan!',
    resetDefaults: 'Kembalikan ke Default',

    discordModalTitle: 'Laporan Ringkasan Shift BRIGCOMM (Discord Format)',
    copyDiscord: 'Salin Format Discord',
    copied: 'Tersalin ke Clipboard!',
    close: 'Tutup',
  },
  en: {
    appSubtitle: 'Daily Quota & Shift System',
    cloudSync: 'Cloud Sync Active',
    shift: 'Shift',
    today: 'Today',
    previousDay: 'Previous Day',
    nextDay: 'Next Day',
    generateReport: 'Generate Shift Report',
    backup: 'Backup & Restore',
    settings: 'Full Settings',
    switchLanguage: 'Switch Language',

    tabDailySheet: 'BRIGCOMM Daily Log Sheet',
    tabInteractiveQuota: 'Interactive Quota Tracker',
    tabBattalionReports: 'Battalion Reports',
    tabAnalytics: 'Analytics & Graphs',
    tabStaffRoster: 'Personnel Roster',
    sheetsModeBadge: 'Sheets Mode',
    unloggedBadge: 'unlogged',

    dailyLogSheetTitle: 'DAILY LOG SHEET',
    searchPersonnel: 'Search personnel / username...',
    printPdf: 'Print / PDF',
    dateCol: 'Date',
    usernameCol: 'Username',
    positionCol: 'Position',
    tryoutCol: 'Tryout',
    tryoutStatsCol: 'Tryout Stats',
    dmsCol: 'DMs Reminder',
    dmsStatsCol: 'DMs Reminder Stats',
    bmtsCol: 'BMTs / SV',
    bmtsStatsCol: 'BMTs / SVs Stats',
    selectionsCol: 'Selections Daily',
    selectionsStatsCol: 'Selections Stats',
    ddtPhasesCol: 'DDT Phases Daily',
    ddtStatsCol: 'DDT Stats',
    wiCol: 'WI Daily',
    wiStatsCol: 'WI Stats',
    inGameHourCol: 'In-game activity hour',
    overseerNotesCol: 'Overseer Notes',
    footerTitle: 'SPREADSHEET FOOTER',
    noPersonnel: 'No personnel assigned to this unit.',

    settingsTitle: 'BRIGCOMM Full Website Settings',
    settingsSubtitle: 'Full customization for titles, shift time, unit quotas, Discord pings, and language preferences.',
    generalTab: 'General & Display',
    quotasTab: 'Target Quotas (Met/Not Met)',
    customActivitiesTab: 'Tasks & Activities Manager',
    discordTab: 'Discord Format & Tags',
    dangerTab: 'Reset Data',

    appNameLabel: 'Application Name / Title',
    appSubtitleLabel: 'Application Subtitle',
    timezoneLabel: 'Timezone & Command Label',
    languageSelectLabel: 'System Language',
    shiftTimeLabel: 'Default Shift End Time (AEST)',
    shiftTimeHelp: 'Standard daily shift report end time (default 20:30).',
    discordHeaderEmojiLabel: 'Discord Header Prefix & Custom Emoji',
    discordHeaderEmojiHelp: 'Header text or custom emoji on the first line of Discord summary.',
    defaultPingLabel: 'Default Role & User Ping Discord',
    defaultPingHelp: 'Discord mention tags automatically placed above the summary.',

    quotaConfigTitle: 'Standard Quota Threshold Configuration',
    quotaConfigHelp: 'Set minimum numbers required for automatic "Met" or "Not Met" status in spreadsheet.',
    firstBatQuotas: '1B BRIGCOMM Quota (Tryouts & DMs)',
    secondBatQuotas: '2B BRIGCOMM Quota (Tryouts, BMTs/SV, DMs)',
    cgQuotas: 'Commandants Guards BRIGCOMM Quota (Selections, DDT, WI, DMs)',
    addNewTask: 'Add New Task / Activity',
    taskNameLabel: 'Activity / Task Name',
    taskShortLabel: 'Short Column Label',
    defaultTargetLabel: 'Default Target Number',
    assignedBattalion: 'Assigned Unit',
    positionOverrides: 'Position Targets (BXO, BSM, Officer)',
    deleteTaskConfirm: 'Are you sure you want to delete this task?',
    noCustomTasks: 'No custom tasks configured yet.',

    saveChanges: 'Save All Settings',
    saving: 'Saving...',
    savedSuccess: 'Settings Saved Successfully!',
    resetDefaults: 'Reset to Defaults',

    discordModalTitle: 'BRIGCOMM Shift Summary Report (Discord Format)',
    copyDiscord: 'Copy Discord Format',
    copied: 'Copied to Clipboard!',
    close: 'Close',
  },
};

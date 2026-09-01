import { BattalionId, Member, DailyMemberLog, AppSettings, BattalionDailyReportData } from '../types';
import { BATTALIONS } from '../constants';
import { getDiscordUnixTimestamp, formatReadableDateTime } from './date';
import { resolveActivityLevel, getActivityEmoji } from './activity';

export interface SummaryOptions {
  date: string;
  useDiscordTimestamp: boolean;
  shiftTime?: string;
  customHeaderEmoji?: string;
  pingString?: string;
  includeBattalionMetrics?: boolean;
}

export { getActivityEmoji };

export function generateDiscordSummary(
  members: Member[],
  memberLogs: Record<string, DailyMemberLog>,
  battalionReports: Record<string, BattalionDailyReportData>,
  settings: AppSettings,
  options: SummaryOptions
): string {
  const {
    date,
    useDiscordTimestamp = true,
    shiftTime = settings.shiftTime || '20:30',
    customHeaderEmoji = settings.discordHeaderEmoji || '<:ETS:962722934508634122> | AEST',
    pingString = settings.defaultPing || '<@1043324306068877453> <@&1430465415280066721>',
    includeBattalionMetrics = false,
  } = options;

  const unixTs = getDiscordUnixTimestamp(date, shiftTime);
  const formattedDate = useDiscordTimestamp ? `<t:${unixTs}:f>` : formatReadableDateTime(date, shiftTime);

  const battalionOrder: BattalionId[] = ['1st_bat', '2nd_bat', 'commandants_guards'];
  const sections: string[] = [];

  for (const batId of battalionOrder) {
    const batInfo = BATTALIONS[batId];
    const batMembers = members.filter((m) => m.battalion === batId && m.status !== 'inactive');
    const batReportKey = `${batId}_${date}`;
    const batReport = battalionReports[batReportKey];

    let section = `# ${customHeaderEmoji} ${batInfo.name} Daily Quota Tracker\n\nDate: ${formattedDate}\n`;

    // Optional Battalion metrics block
    if (includeBattalionMetrics && batReport) {
      section += `\n**Battalion Activity:**\n`;
      if (batId === '1st_bat' && batReport.firstBat) {
        section += `> • Tryouts: **${batReport.firstBat.tryouts}** | Recruited: **${batReport.firstBat.recruited}** | Events: **${batReport.firstBat.events}**\n`;
      } else if (batId === '2nd_bat' && batReport.secondBat) {
        section += `> • Supervisions: **${batReport.secondBat.supervisions}** | BMT: **${batReport.secondBat.bmt}** | Events: **${batReport.secondBat.events}**\n`;
      } else if (batId === 'commandants_guards' && batReport.commandantsGuards) {
        section += `> • Recruited: **${batReport.commandantsGuards.recruited}** | Selections: **${batReport.commandantsGuards.selections}** | Events: **${batReport.commandantsGuards.events}** | DDT Phases: **${batReport.commandantsGuards.ddtPhases}**\n`;
      }
    }

    section += `Member:\n`;

    if (batMembers.length === 0) {
      section += `> *No active members assigned*\nNotes: *None*\n`;
    } else {
      // Member bullet lines with in-game activity hours emoji ( 🔴  ), ( 🟡  ), ( 🟢  ), ( 🔵  )
      for (const m of batMembers) {
        const logKey = `${m.id}_${date}`;
        const log = memberLogs[logKey];
        const emoji = getActivityEmoji(log);
        const memberRef = m.discordId ? `<@${m.discordId.trim()}>` : m.name;

        section += `> * ${memberRef} ( ${emoji}  )\n`;
      }

      // Notes section
      const notesList: string[] = [];
      for (const m of batMembers) {
        const logKey = `${m.id}_${date}`;
        const log = memberLogs[logKey];
        const level = log?.activityLevel || (log?.status as any) || 'under_1h';
        const memberRef = m.discordId ? `<@${m.discordId.trim()}>` : m.name;

        let noteText = log?.note?.trim();
        if (!noteText) {
          if (level === 'under_1h' || level === 'no_logs') {
            noteText = `***No Logs*** (Demotion notice)`;
          } else if (level === 'exempted' || (level as string) === 'loa') {
            noteText = `***Exempted***`;
          }
        }

        if (noteText) {
          notesList.push(`${memberRef} ${noteText}`);
        }
      }

      if (notesList.length > 0) {
        if (notesList.length === 1) {
          section += `Note: ${notesList[0]}\n`;
        } else {
          section += `Notes:\n`;
          for (const n of notesList) {
            section += `> • ${n}\n`;
          }
        }
      } else {
        section += `Notes: ***None***\n`;
      }
    }

    sections.push(section);
  }

  // Combine sections with 1 empty line
  let output = sections.join('\n');

  if (pingString && pingString.trim().length > 0) {
    output += `\nPing: ${pingString.trim()}`;
  }

  return output;
}

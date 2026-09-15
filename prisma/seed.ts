import "dotenv/config";
import { randomBytes } from "node:crypto";
import { PrismaPg } from "@prisma/adapter-pg";
import { PrismaClient } from "../src/generated/prisma/client";
import { fixtures } from "./fixtures";

const adapter = new PrismaPg({ connectionString: process.env.DATABASE_URL });
const prisma = new PrismaClient({ adapter });

function shareSlug(base: string) {
  return `${base}-${randomBytes(3).toString("hex")}`;
}

async function main() {
  // Meeting cascade-deletes Participant/TranscriptSegment/Summary/ActionItem/Highlight.
  await prisma.meeting.deleteMany();

  for (const fixture of fixtures) {
    const meeting = await prisma.meeting.create({
      data: {
        title: fixture.title,
        startedAt: new Date(fixture.startedAt),
        durationSec: fixture.durationSec,
        attendeeCount: fixture.participants.length,
        shareSlug: shareSlug(fixture.slugBase),
      },
    });

    const participantIdByName = new Map<string, string>();
    for (const name of fixture.participants) {
      const participant = await prisma.participant.create({
        data: { meetingId: meeting.id, name },
      });
      participantIdByName.set(name, participant.id);
    }

    await prisma.transcriptSegment.createMany({
      data: fixture.segments.map((segment, order) => {
        const speakerId = participantIdByName.get(segment.speaker);
        if (!speakerId) {
          throw new Error(
            `Fixture "${fixture.title}": segment speaker "${segment.speaker}" is not in participants list`
          );
        }
        return {
          meetingId: meeting.id,
          speakerId,
          startSec: segment.startSec,
          endSec: segment.endSec,
          text: segment.text,
          order,
        };
      }),
    });

    console.log(
      `Seeded "${fixture.title}" (${fixture.segments.length} segments, ${fixture.participants.length} participants) — /share/${meeting.shareSlug}`
    );
  }
}

main()
  .catch((err) => {
    console.error(err);
    process.exitCode = 1;
  })
  .finally(async () => {
    await prisma.$disconnect();
  });

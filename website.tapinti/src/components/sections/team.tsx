import { useTranslations } from "next-intl";
import Image from "next/image";
import { SectionHeading } from "@/components/ui/section-heading";
import { Reveal } from "@/components/ui/reveal";

const members = [
  { key: "saber", image: "/team/saber-motamedi.webp", width: 640, height: 640 },
  { key: "mobina", image: "/team/mobina-maleki.webp", width: 640, height: 800 },
  { key: "nadia", image: "/team/nadia-maleki.webp", width: 640, height: 640 },
  { key: "nazanin", image: "/team/nazanin.webp", width: 640, height: 800 },
] as const;

export function Team() {
  const t = useTranslations("team");

  return (
    <section id="team" className="neo-section relative py-24 sm:py-32">
      <div className="mx-auto max-w-6xl px-4 sm:px-6">
        <SectionHeading eyebrow={t("eyebrow")} title={t("title")} />

        <div className="mt-16 grid grid-cols-2 gap-4 sm:grid-cols-4">
          {members.map((member, i) => {
            const name = t(`members.${member.key}.name`);
            return (
              <Reveal key={member.key} delayIndex={i % 4}>
                <figure className="neo-card flex h-full flex-col items-center rounded-2xl border border-border bg-card p-5 text-center shadow-sm">
                  <div className="relative aspect-square w-full overflow-hidden rounded-xl">
                    <Image
                      src={member.image}
                      alt={name}
                      width={member.width}
                      height={member.height}
                      className="h-full w-full object-cover"
                    />
                  </div>
                  <figcaption className="mt-4 font-semibold">{name}</figcaption>
                </figure>
              </Reveal>
            );
          })}
        </div>
      </div>
    </section>
  );
}

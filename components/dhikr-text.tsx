import type { RepeatableItem } from '@/lib/dhikr-data'

/** One text layout for every remembrance, in both counter modes. */
export default function DhikrText({ item }: { item: RepeatableItem }) {
  const paragraphs = item.arabic?.split(/\n\s*\n/).filter(Boolean) ?? []
  const isLong = (item.arabic?.length ?? 0) > 100

  return (
    <div className="flex w-full min-w-0 flex-col gap-5">
      {paragraphs.length > 0 && (
        <div className="flex w-full min-w-0 flex-col gap-5" style={{ color: 'var(--text-primary)' }}>
          {paragraphs.map((paragraph, index) => (
            <p
              key={index}
              lang="ar"
              dir="rtl"
              className={`dhikr-arabic${isLong ? ' dhikr-arabic-long' : ''}`}
            >
              {paragraph}
            </p>
          ))}
        </div>
      )}
      <div className="dhikr-supporting-text flex flex-col gap-4" dir="ltr">
        <div>
          <span className="dhikr-label">Transliteration / title</span>
          <p className="font-medium" style={{ color: 'var(--text-primary)' }}>{item.transliteration}</p>
        </div>
        <div>
          <span className="dhikr-label">Meaning / guidance</span>
          <p style={{ color: 'var(--text-secondary)' }}>{item.translation}</p>
        </div>
      </div>
    </div>
  )
}

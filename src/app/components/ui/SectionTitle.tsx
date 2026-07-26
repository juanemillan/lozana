export function SectionTitle({ children, action }: { children: React.ReactNode; action?: React.ReactNode }) {
  return (
    <div className="mt-6 mb-2.5 flex items-center justify-between gap-3 first:mt-0">
      <h2 className="text-[17px]">{children}</h2>
      {action}
    </div>
  );
}

export function EmptyState({ children }: { children: React.ReactNode }) {
  return <div className="py-2.5 text-[13px] italic text-ink-soft">{children}</div>;
}

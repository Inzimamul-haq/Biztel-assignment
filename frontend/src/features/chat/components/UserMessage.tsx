export function UserMessage({ content }: { content: string }) {
  return (
    <div className="animate-fade-up flex justify-end">
      <div className="max-w-[85%] whitespace-pre-wrap rounded-2xl rounded-br-md bg-ink-700 px-4 py-2.5 text-[15px] leading-relaxed text-zinc-100 sm:max-w-[75%]">
        {content}
      </div>
    </div>
  );
}
